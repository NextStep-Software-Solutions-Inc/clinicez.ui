"use server";

import "server-only";
import prisma from "@lib/prisma";
import { Severity, Prisma } from "@prisma/client";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { findUserSafely } from "@/lib/user-sync";

export const addUserDisabilityAction = async (payload: {
  userId: string;
  disability: string;
  severity: Severity,
  notes?: string | null,
  isManaged?: boolean,
  dateDiagnosed: Date
}) => {
  const { userId, disability, severity, notes, dateDiagnosed, isManaged } = payload;

  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  return await prisma.userDisability.create({
    data: {
      severity,
      notes: notes,
      dateDiagnosed,
      ...(isManaged ? { isManaged: true } : {}),
      User: {
        connect: {
          id: currentUser.id
        },
      },
      Disability: {
        connectOrCreate: {
          where: { name: disability },
          create: { name: disability }
        }
      }
    }
  });
};


export type GetUserDisabilities = Awaited<ReturnType<typeof getUserDisabilitiesAction>>
export const getUserDisabilitiesAction = cache(async (userId: string) => {
  return await prisma.userDisability.findMany({
    orderBy: {
      dateDiagnosed: "desc"
    },
    where: {
      User: {
        userId
      }
    },
    select: {
      id: true,
      severity: true,
      notes: true,
      dateDiagnosed: true,

      isManaged: true,
      Disability: {
        select: {
          name: true
        }
      }
    }
  })
})

export const updateUserDisabilityAction = async (payload: {
  id: number
  severity: Severity,
  notes?: string | null,
  dateDiagnosed: Date
}) => {
  const { id, severity, notes, dateDiagnosed } = payload;
  return await prisma.userDisability.update({
    where: { id },
    data: {
      severity,
      notes,
      dateDiagnosed
    }
  })
}

export const deleteUserDisabilityAction = async (id: number) => {
  return await prisma.userDisability.delete({
    where: { id }
  })
}

export const upsertUserDisabilityAction = withErrorHandling(async (payload: {
  id: number,
  userId: string,
  disability: string,
  severity: Severity,
  notes?: string | null,
  isManaged?: boolean,
  dateDiagnosed?: Date
}) => {
  const { id, userId, disability, severity, notes, dateDiagnosed, isManaged } = payload;

  // Validate input
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Use retry mechanism to handle database conflicts
  const result = await withRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      // Find the user safely, handling migration scenarios
      const currentUser = await findUserSafely(userId);

      if (!currentUser) {
        throw new Error(`User with ID ${userId} not found or inactive`);
      }

      return await tx.userDisability.upsert({
        where: { id },
        create: {
          notes,
          severity,
          dateDiagnosed,
          ...(isManaged ? { isManaged: true } : {}),
          Disability: {
            connectOrCreate: {
              where: { name: disability },
              create: { name: disability }
            }
          },
          User: {
            connect: {
              id: currentUser.id
            }
          }
        },
        update: {
          severity,
          notes,
          dateDiagnosed,
          ...(isManaged ? { isManaged: true } : {}),
          Disability: {
            connectOrCreate: {
              where: { name: disability },
              create: { name: disability }
            }
          }
        },
        select: {
          id: true,
          severity: true,
          notes: true,
          dateDiagnosed: true,
          Disability: {
            select: {
              name: true
            }
          }
        }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 10000
    });
  }, 3, 200);

  return { message: "User disability updated successfully", data: result };
}, async (error) => {
  console.error("upsertUserDisabilityAction error:", error);
  throw error;
});

export const setIsManagedAction = async (id: number, isManaged: boolean) => {
  return await prisma.userDisability.update({
    where: { id },
    data: {
      isManaged
    }
  })
}