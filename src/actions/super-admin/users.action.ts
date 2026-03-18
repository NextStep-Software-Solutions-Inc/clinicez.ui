"use server";

import "server-only";
import prisma from "@lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { isSuperAdminAction } from "./admin-check.action";

export type GetAllUsers = Awaited<ReturnType<typeof getAllUsersAction>>;
export async function getAllUsersAction({
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  const where = search
    ? {
      OR: [
        { userId: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ],
    }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        gender: true,
        dob: true,
        createdAt: true,
        updatedAt: true,
        verificationStatus: true,
        verifiedAt: true,
        _count: {
          select: {
            ClinicMembers: true,
            OrganizationMembers: true,
            Tenants: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type GetUserDetails = Awaited<ReturnType<typeof getUserDetailsAction>>;
export async function getUserDetailsAction(userId: string) {
  const user = await prisma.user.findFirst({
    where: { userId },
    select: {
      id: true,
      userId: true,
      email: true,
      firstName: true,
      lastName: true,
      middleName: true,
      gender: true,
      dob: true,
      createdAt: true,
      updatedAt: true,
      ClinicMembers: {
        select: {
          id: true,
          status: true,
          Clinic: {
            select: {
              id: true,
              name: true,
              clinicUid: true,
            },
          },
          Role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      OrganizationMembers: {
        select: {
          id: true,
          status: true,
          Organization: {
            select: {
              id: true,
              name: true,
              orgUid: true,
            },
          },
          OrganizationRole: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      Tenants: {
        select: {
          id: true,
          name: true,
          tenantUid: true,
        },
      },
    },
  });

  return { data: user };
}

export type UpdateUserByAdminPayload = {
  firstName: string;
  lastName: string;
  email: string;
};

export async function updateUserByAdminAction(
  userDbId: number,
  payload: UpdateUserByAdminPayload
): Promise<{ success: boolean; message: string }> {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    return { success: false, message: "Unauthorized: Only super admins can edit users." };
  }

  const { firstName, lastName, email } = payload;

  // Fetch current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userDbId },
    select: { id: true, userId: true, email: true, firstName: true, lastName: true },
  });

  if (!currentUser) {
    return { success: false, message: "User not found." };
  }

  const emailChanged = email !== currentUser.email;

  // Ensure new email is not already taken by another user
  if (emailChanged) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== currentUser.id) {
      return { success: false, message: "Email address is already in use by another user." };
    }
  }

  // Update the database record
  await prisma.user.update({
    where: { id: userDbId },
    data: { firstName, lastName, email, updatedAt: new Date() },
  });

  // Sync changes to Clerk
  if (currentUser.userId) {
    try {
      const clerk = await clerkClient();

      // Sync name changes
      const nameChanges: { firstName?: string; lastName?: string } = {};
      if (firstName !== currentUser.firstName) nameChanges.firstName = firstName;
      if (lastName !== currentUser.lastName) nameChanges.lastName = lastName;
      if (Object.keys(nameChanges).length > 0) {
        await clerk.users.updateUser(currentUser.userId, nameChanges);
      }

      // Sync email change
      if (emailChanged) {
        // Capture the old primary email address ID before creating the new one
        const clerkUser = await clerk.users.getUser(currentUser.userId);
        const oldPrimaryEmailAddressId = clerkUser.primaryEmailAddressId;

        const newEmailAddress = await clerk.emailAddresses.createEmailAddress({
          userId: currentUser.userId,
          emailAddress: email,
          verified: true,
          primary: true,
        });
        await clerk.users.updateUser(currentUser.userId, {
          primaryEmailAddressID: newEmailAddress.id,
        });

        // Remove the old email address from Clerk
        if (oldPrimaryEmailAddressId) {
          try {
            await clerk.emailAddresses.deleteEmailAddress(oldPrimaryEmailAddressId);
          } catch (deleteError) {
            console.error("[CLERK_SYNC_ERROR] Failed to delete old email address from Clerk:", deleteError);
          }
        }
      }
    } catch (clerkError) {
      console.error("[CLERK_SYNC_ERROR] Failed to sync user changes to Clerk:", clerkError);
      // Database update succeeded; log but don't fail the action
    }
  }

  return { success: true, message: "User updated successfully." };
}
