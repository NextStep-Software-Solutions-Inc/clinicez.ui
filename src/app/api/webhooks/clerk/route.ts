import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import prisma from "@lib/prisma";
import { $Enums } from "@prisma/client";

// Type alias for Prisma transaction client
type PrismaTransaction = Parameters<Parameters<typeof prisma["$transaction"]>[0]>[0];

// Webhook event types from Clerk
type ClerkWebhookEvent = {
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

/**
 * Clerk Webhook Handler
 * 
 * This endpoint handles user.created and user.updated events from Clerk
 * to keep our database in sync with Clerk's user data.
 * 
 * Setup Instructions:
 * 1. In Clerk Dashboard, go to Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated
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
    const { type, data } = evt;
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

    // Upsert user to database
    if (type === "user.created" || type === "user.updated") {
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
