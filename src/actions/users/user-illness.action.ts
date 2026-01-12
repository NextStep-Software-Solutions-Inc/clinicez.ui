"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isHP } from "@lib/org-utils";
import { cache } from "react";
import { HealthConditionStatus, Severity } from "@/types";
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { findUserSafely } from "@/lib/user-sync";
import { Prisma } from "@prisma";

export const addUserIllnessAction = async (payload: {
  userId: string;
  illness: string;
  severity: Severity,
  notes?: string,
  dateDiagnosed?: Date,
}) => {
  const { userId, illness, severity, notes, dateDiagnosed } = payload;
  return await prisma.userHealthCondition.create({
    data: {
      severity,
      notes: notes,
      dateDiagnosed,
      User: {
        connect: {
          userId
        },
      },
      HealthCondition: {
        connectOrCreate: {
          where: { name: illness },
          create: { name: illness }
        }
      }
    }
  })
};

export type GetUserIllnesses = Awaited<ReturnType<typeof getUserIllnessesAction>>
export const getUserIllnessesAction = cache(async (userId?: string) => {
  return await prisma.userHealthCondition.findMany({
    orderBy: {
      dateDiagnosed: "desc"
    },
    ...(userId && {
      where: {
        User: {
          userId
        }
      }
    }),
    select: {
      id: true,
      severity: true,
      notes: true,
      dateDiagnosed: true,
      dateResolved: true,
      status: true,
      ResolvedBy: {
        select: {
          id: true,
          userId: true,
          picture: true,
          firstName: true,
          lastName: true
        }
      },
      DiagnosedBy: {
        select: {
          id: true,
          userId: true,
          picture: true,
          firstName: true,
          lastName: true
        },
      },
      HealthCondition: {
        select: {
          name: true
        }
      }
    }
  });
})

export const updateUserIllnessAction = async (payload: {
  id: number
  severity: Severity,
  notes?: string,
  dateDiagnosed: Date,
}) => {
  const { id, severity, notes, dateDiagnosed } = payload;
  return await prisma.userHealthCondition.update({
    where: { id },
    data: {
      severity,
      notes,
      dateDiagnosed
    }
  })
}

export const deleteUserIllnessAction = async (id: number) => {
  return await prisma.userHealthCondition.delete({
    where: { id }
  })
}

export const upsertUserIllnessAction = withErrorHandling(async (payload: {
  id: number,
  userId: string,
  illness: string,
  severity: Severity,
  notes?: string | null,
  dateDiagnosed?: Date,
}) => {
  const { id, userId, illness, severity, notes, dateDiagnosed } = payload;

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

      return await tx.userHealthCondition.upsert({
        where: { id },
        create: {
          notes,
          severity,
          dateDiagnosed,
          HealthCondition: {
            connectOrCreate: {
              where: { name: illness },
              create: { name: illness }
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
          HealthCondition: {
            connectOrCreate: {
              where: { name: illness },
              create: { name: illness }
            }
          }
        },
        select: {
          id: true,
          severity: true,
          notes: true,
          dateDiagnosed: true,
          dateResolved: true,
          status: true,
          HealthCondition: {
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

  return { message: "User health condition updated successfully", data: result };
}, async (error) => {
  console.error("upsertUserIllnessAction error:", error);
  throw error;
});


type ResponseType = { status: boolean, message: string }

export async function setUserIllnessStatusAction(id: number, status: HealthConditionStatus, userId?: string): Promise<ResponseType> {
  const hp = await isHP()
  if (!hp) return {
    status: false,
    message: "You are not authorized to perform this action. Only Health Professionals can perform this action."
  }
  await prisma.userHealthCondition.update({
    where: { id },
    data: {
      status,
      ...(status === "RESOLVED" && userId ? {
        dateResolved: new Date(),
        ResolvedBy: {
          connect: {
            userId
          }
        }
      } : {})
    }
  })
  return {
    status: true,
    message: "Illness is now set as resolved"
  }
}
