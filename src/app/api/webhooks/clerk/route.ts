import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@lib/prisma";
import { $Enums } from "@prisma/client";

// Type alias for Prisma transaction client
type PrismaTransaction = Parameters<Parameters<typeof prisma["$transaction"]>[0]>[0];

// Webhook event types from Clerk
type UserWebhookEvent = {
  type: "user.created" | "user.updated";
  data: {
    id: string;
    external_id: string | null;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    profile_image_url: string | null;
    primary_email_address_id: string | null;
  };
};

type SessionWebhookEvent = {
  type: "session.created" | "session.ended" | "session.removed" | "session.revoked";
  data: {
    id: string;
    user_id: string;
    status: string;
    last_active_at: number;
    expire_at: number;
    abandon_at: number;
    created_at: number;
    updated_at: number;
    client_id: string;
  };
};

type ClerkWebhookEvent = UserWebhookEvent | SessionWebhookEvent;

/**
 * Clerk Webhook Handler
 *
 * Handles the following Clerk webhook events to keep our database in sync:
 *   - user.created   – create user record and assign default permissions
 *   - user.updated   – sync profile changes (name, email, avatar)
 *   - session.created  – audit-log user sign-in
 *   - session.ended    – audit-log natural session expiry / sign-out
 *   - session.removed  – audit-log explicit session deletion
 *   - session.revoked  – audit-log session revocation (security action)
 *
 * Setup Instructions:
 * 1. In Clerk Dashboard, go to Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated,
 *    session.created, session.ended, session.removed, session.revoked
 * 4. Copy the webhook secret to CLERK_WEBHOOK_SECRET env variable
 */
export async function POST(request: NextRequest) {
  try {
    // Get the webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Missing svix headers" },
        { status: 400 }
      );
    }

    // Get the body
    const body = await request.text();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: ClerkWebhookEvent;

    // Verify the webhook signature
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the webhook
    const { type } = evt;

    // ── User events ──────────────────────────────────────────────────────────
    if (type === "user.created" || type === "user.updated") {
      const data = (evt as UserWebhookEvent).data;
      const userId = data.id;

      // Get primary email
      const primaryEmail = data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id
      );

      if (!primaryEmail) {
        console.error(`No primary email found for user ${userId}`);
        return NextResponse.json(
          { error: "No primary email found" },
          { status: 400 }
        );
      }

      const email = primaryEmail.email_address;
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      // Prioritize profile_image_url (user's uploaded image) over image_url (social login image)
      const picture = data.profile_image_url || data.image_url || null;
      const externalId = data.external_id || null;

      await prisma.$transaction(
        async (tx) => {
          // Check if user exists by Clerk userId
          let existingUser = await tx.user.findUnique({
            where: { userId },
          });

          // Migration case: user was imported from another provider (e.g. Auth0).
          // Clerk stores the old provider ID as external_id. Find the DB record by
          // external_id and update it to use the new Clerk userId.
          if (!existingUser && externalId) {
            existingUser = await tx.user.findUnique({
              where: { userId: externalId },
            });

            if (existingUser) {
              await tx.user.update({
                where: { id: existingUser.id },
                data: {
                  userId,
                  email,
                  firstName,
                  lastName,
                  picture,
                  updatedAt: new Date(),
                },
              });
              console.log(`Migrated user ${externalId} -> ${userId} (${email}) via external_id`);
              return;
            }
          }

          // Secondary fallback: find by email for migrated users where external_id is not set.
          // Update their userId to the new Clerk ID to avoid duplicate user creation.
          if (!existingUser) {
            const userByEmail = await tx.user.findUnique({
              where: { email },
            });

            if (userByEmail) {
              if (userByEmail.userId !== userId) {
                await tx.user.update({
                  where: { id: userByEmail.id },
                  data: {
                    userId,
                    firstName,
                    lastName,
                    picture,
                    updatedAt: new Date(),
                  },
                });
                console.log(`Migrated user ${userByEmail.userId} -> ${userId} via email`);
                return;
              }
              // User already has the correct Clerk userId — treat as existing
              existingUser = userByEmail;
            }
          }

          if (existingUser) {
            // Update existing user
            await tx.user.update({
              where: { userId },
              data: {
                email,
                firstName,
                lastName,
                picture,
                updatedAt: new Date(),
              },
            });
            console.log(`Updated user ${userId} (${email})`);
          } else {
            // Create new user
            const newUser = await tx.user.create({
              data: {
                userId,
                email,
                firstName,
                lastName,
                mobile: "",
                picture,
                isActive: true,
                onboardingStatus: $Enums.OnboardingStatus.NOT_STARTED,
                profileCompletionStatus:
                  $Enums.ProfileCompletionStatus.INCOMPLETE,
                accountType: $Enums.AccountType.FULL,
              },
            });

            // Assign default user permissions
            await assignUserPermissions(tx, newUser.id);

            console.log(`Created new user ${userId} (${email})`);
          }
        },
        {
          timeout: 15000, // 15 seconds timeout for webhook processing
          maxWait: 20000, // 20 seconds max wait
        }
      );
    }

    // ── Session events ───────────────────────────────────────────────────────
    if (
      type === "session.created" ||
      type === "session.ended" ||
      type === "session.removed" ||
      type === "session.revoked"
    ) {
      await handleSessionEvent(evt as SessionWebhookEvent);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Assign default permissions to a new user
 *
 * Queries permissions within the transaction to ensure consistency
 */
async function assignUserPermissions(
  tx: PrismaTransaction,
  userId: number
) {
  // Query permissions directly within the transaction for consistency
  const permissions = await tx.permission.findMany({
    where: {
      isActive: true,
      type: "USER",
    },
  });

  // Filter out SUPER_ADMIN permission as it should be granted manually
  const filteredPermissions = permissions.filter(
    (permission) => permission.name !== "SUPER_ADMIN"
  );

  if (filteredPermissions.length > 0) {
    await tx.userPermission.createMany({
      data: filteredPermissions.map((permission) => ({
        userId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }
}

/**
 * Handle Clerk session webhook events.
 *
 * Maps each event type to a corresponding AuditAction and writes a record
 * to the AuditLog table.  If the user cannot be found in the database the
 * event is acknowledged (200) but not persisted – this prevents a 5xx retry
 * loop when a session fires before user.created is processed.
 *
 * User lookup follows the same multi-step strategy used by user events to
 * handle accounts migrated from a previous auth provider:
 *   1. Direct Clerk userId match
 *   2. external_id match (old provider ID stored as userId in DB)
 *   3. Primary email match
 */
async function handleSessionEvent(evt: SessionWebhookEvent): Promise<void> {
  const { type, data } = evt;
  const { id: sessionId, user_id: clerkUserId } = data;

  // Step 1: direct Clerk userId match
  let user = await prisma.user.findUnique({
    where: { userId: clerkUserId },
    select: { id: true },
  });

  // Steps 2 & 3: for migrated users the Clerk userId may not yet be in the DB
  // (e.g. user.created webhook hasn't been processed, or migration hasn't run).
  // Fetch the full Clerk user record to get external_id and primary email so we
  // can apply the same fallback lookups the user-event handler uses.
  if (!user) {
    try {
      const clerkApi = await clerkClient();
      const clerkUser = await clerkApi.users.getUser(clerkUserId);

      const externalId = clerkUser.externalId ?? null;
      const primaryEmailObj = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      );
      const email = primaryEmailObj?.emailAddress ?? null;

      // Step 2: old provider ID stored as userId in DB (migration path)
      if (externalId) {
        user = await prisma.user.findUnique({
          where: { userId: externalId },
          select: { id: true },
        });
        if (user) {
          console.log(
            `Session event "${type}": resolved migrated user ${clerkUserId} via external_id ${externalId}`
          );
        }
      }

      // Step 3: fallback to primary email
      if (!user && email) {
        user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (user) {
          console.log(
            `Session event "${type}": resolved migrated user ${clerkUserId} via email ${email}`
          );
        }
      }
    } catch (err) {
      console.warn(
        `Session event "${type}": failed to fetch Clerk user ${clerkUserId} for fallback lookup – ${err}`
      );
    }
  }

  if (!user) {
    console.warn(
      `Session event "${type}" received for unknown Clerk user ${clerkUserId} – skipping audit log`
    );
    return;
  }

  const auditActionMap: Record<SessionWebhookEvent["type"], $Enums.AuditAction> = {
    "session.created": $Enums.AuditAction.SESSION_LOGIN,
    // Both session.ended (natural expiry / user sign-out) and session.removed
    // (explicit backend deletion) represent the end of a session.  They are
    // grouped under SESSION_LOGOUT because the outcome for audit purposes is
    // the same; the raw event type is preserved in the metadata.sessionId for
    // finer-grained queries if needed.
    "session.ended": $Enums.AuditAction.SESSION_LOGOUT,
    "session.removed": $Enums.AuditAction.SESSION_LOGOUT,
    "session.revoked": $Enums.AuditAction.SESSION_REVOKED,
  };

  await prisma.auditLog.create({
    data: {
      entityType: $Enums.AuditEntityType.USER,
      entityId: user.id,
      action: auditActionMap[type],
      performedBy: user.id,
      metadata: {
        event: type,
        sessionId,
        status: data.status,
        lastActiveAt: data.last_active_at,
        expireAt: data.expire_at,
        clientId: data.client_id,
      },
    },
  });

  console.log(`Session event "${type}" logged for user ${clerkUserId} (session ${sessionId})`);
}
