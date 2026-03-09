"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { Prisma } from "@prisma/client";


export type GetMyUserPreference = Awaited<ReturnType<typeof getMyUserPreferenceAction>>;
export const getMyUserPreferenceAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  // Use retry mechanism to handle potential database issues
  const userPreference = await withRetry(async () => {
    return await prisma.userPreference.findFirst({
      where: {
        User: {
          userId: session.user.sub
        }
      },
      include: {
        HealthCareProvider: {
          select: {
            id: true,
            HPType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
  }, 3, 200);

  if (!userPreference) {
    return { message: "No user preference found.", data: null };
  }

  return { message: "User preference fetched successfully.", data: userPreference };
}, async (error) => {
  console.error(`Error fetching user preference: ${error}`);
  if (error instanceof Error) return error.message;
});

type UpsertUserPreferencePayload = {
  userPreferenceId: number;
  autoAcceptAppointmentAssignment: boolean;
  autoAssignAppointmentToSelf: boolean;
  defaultHpId?: number;
  muteNotifications: boolean;
}

export const upsertMyUserPreference = withErrorHandling(async (payload: UpsertUserPreferencePayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const { defaultHpId, autoAssignAppointmentToSelf, autoAcceptAppointmentAssignment, muteNotifications } = payload;

  // Use retry mechanism to handle database conflicts
  const userPreference = await withRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      return await tx.userPreference.upsert({
        where: {
          id: payload.userPreferenceId,
          User: {
            userId: session.user.sub
          }
        },
        create: {
          User: {
            connect: {
              userId: session.user.sub
            }
          },
          ...(autoAssignAppointmentToSelf && defaultHpId ? {
            HealthCareProvider: {
              connect: {
                id: defaultHpId
              }
            }
          } : {}),
          autoAcceptAppointmentAssignment,
          autoAssignAppointmentToSelf,
          muteNotifications,
        },
        update: {
          ...(autoAssignAppointmentToSelf && defaultHpId ? { defaultHpId } : { defaultHpId: null }),
          autoAcceptAppointmentAssignment,
          autoAssignAppointmentToSelf,
          muteNotifications,
        }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 10000
    });
  }, 3, 200);

  return { message: "User preference updated successfully.", data: userPreference };
}, async (error) => {
  console.error(`Error upserting user preference: ${error}`);
  if (error instanceof Error) return error.message;
});