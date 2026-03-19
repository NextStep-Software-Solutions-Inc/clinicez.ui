"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { NotificationType, Prisma } from "@prisma/client";
import type { AppointmentListPreference } from "@/types/appointment-preference";


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
  subscribedNotificationTypes?: NotificationType[];
}

export const upsertMyUserPreference = withErrorHandling(async (payload: UpsertUserPreferencePayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const { defaultHpId, autoAssignAppointmentToSelf, autoAcceptAppointmentAssignment, muteNotifications, subscribedNotificationTypes } = payload;

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
          subscribedNotificationTypes: subscribedNotificationTypes ?? [],
        },
        update: {
          ...(autoAssignAppointmentToSelf && defaultHpId ? { defaultHpId } : { defaultHpId: null }),
          autoAcceptAppointmentAssignment,
          autoAssignAppointmentToSelf,
          muteNotifications,
          subscribedNotificationTypes: subscribedNotificationTypes ?? [],
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
export type GetAppointmentListPreference = Awaited<ReturnType<typeof getAppointmentListPreferenceAction>>;
export const getAppointmentListPreferenceAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const userPreference = await withRetry(async () => {
    return await prisma.userPreference.findFirst({
      where: { User: { userId: session.user.sub } },
      select: { appointmentListPreference: true }
    });
  }, 3, 200);

  return { 
    message: "Preference fetched.", 
    data: userPreference?.appointmentListPreference as AppointmentListPreference | null 
  };
});

export const upsertAppointmentListPreferenceAction = withErrorHandling(async (preference: AppointmentListPreference) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prisma.user.findUniqueOrThrow({ where: { userId: session.user.sub }, select: { id: true } });
  
  await withRetry(async () => {
    return await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, appointmentListPreference: preference },
      update: { appointmentListPreference: preference },
    });
  }, 3, 200);

  return { message: "Appointment list preference saved.", data: preference };
});
