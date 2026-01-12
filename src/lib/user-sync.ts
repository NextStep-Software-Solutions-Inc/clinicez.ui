/**
 * User Synchronization Service
 * Handles Auth0 to Clerk migration edge cases and ensures user consistency
 */

import { Prisma } from "@prisma/client";
import prisma from "@lib/prisma";

export interface UserSyncResult {
  id: number;
  userId: string;
  email: string;
  isMigrated: boolean;
}

/**
 * Ensures user exists and is properly synchronized between Auth0 and Clerk
 * This handles edge cases during the migration period
 */
export async function ensureUserExists(
  clerkUserId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<UserSyncResult> {
  return await prisma.$transaction(async (tx) => {
    // Step 1: Try to find user by Clerk ID
    let user = await tx.user.findUnique({
      where: {
        userId: clerkUserId,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        email: true
      }
    });

    if (user) {
      // User found by Clerk ID - normal case
      return {
        ...user,
        isMigrated: false
      };
    }

    // Step 2: Try to find by email (migration case)
    user = await tx.user.findUnique({
      where: {
        email: email,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        email: true
      }
    });

    if (user && user.userId !== clerkUserId) {
      // Migration case: update Auth0 userId to Clerk userId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          userId: clerkUserId,
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
        },
        select: {
          id: true,
          userId: true,
          email: true
        }
      });

      return {
        ...updatedUser,
        isMigrated: true
      };
    }

    if (user && user.userId === clerkUserId) {
      // Already migrated
      return {
        ...user,
        isMigrated: true
      };
    }

    // Step 3: Create new user if not found
    const newUser = await tx.user.create({
      data: {
        userId: clerkUserId,
        email: email,
        mobile: "",
        firstName: firstName || "",
        lastName: lastName || ""
      },
      select: {
        id: true,
        userId: true,
        email: true
      }
    });

    return {
      ...newUser,
      isMigrated: false
    };

  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    maxWait: 5000,
    timeout: 10000
  });
}

/**
 * Safe user lookup that handles migration scenarios
 */
export async function findUserSafely(
  clerkUserId: string,
  email?: string
): Promise<{ id: number; userId: string; email: string } | null> {
  try {
    // First try by Clerk ID
    let user = await prisma.user.findUnique({
      where: {
        userId: clerkUserId,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        email: true
      }
    });

    if (user) {
      return user;
    }

    // If not found and email provided, try by email
    if (email) {
      user = await prisma.user.findUnique({
        where: {
          email: email,
          isActive: true
        },
        select: {
          id: true,
          userId: true,
          email: true
        }
      });

      return user;
    }

    return null;
  } catch (error) {
    console.error('Error in findUserSafely:', error);
    return null;
  }
}
