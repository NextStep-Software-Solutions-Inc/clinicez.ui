"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { Prisma } from "@prisma/client";
import type { AppointmentListPreference, UserPreferences } from "@/types/appointment-preference";


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
  subscribedNotificationTypes?: string[];
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

const VALID_SORT_ORDERS: AppointmentListPreference["sortOrder"][] = ["schedule", "createdAt"];
const VALID_SORT_DIRECTIONS: AppointmentListPreference["sortDirection"][] = ["asc", "desc"];

function isAppointmentListPreference(value: unknown): value is AppointmentListPreference {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if ("sortOrder" in v && v.sortOrder !== undefined && !VALID_SORT_ORDERS.includes(v.sortOrder as AppointmentListPreference["sortOrder"])) return false;
  if ("sortDirection" in v && v.sortDirection !== undefined && !VALID_SORT_DIRECTIONS.includes(v.sortDirection as AppointmentListPreference["sortDirection"])) return false;
  if ("statusFilter" in v && v.statusFilter !== undefined && typeof v.statusFilter !== "string") return false;
  if ("providerIds" in v && v.providerIds !== undefined && !Array.isArray(v.providerIds)) return false;
  return true;
}

function parseUserPreferences(raw: unknown): UserPreferences {
  if (typeof raw !== "object" || raw === null) return {};
  return raw as UserPreferences;
}

export type GetAppointmentListPreference = Awaited<ReturnType<typeof getAppointmentListPreferenceAction>>;
export const getAppointmentListPreferenceAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const userPreference = await withRetry(async () => {
    return await prisma.userPreference.findFirst({
      where: { User: { userId: session.user.sub } },
      select: { preferences: true }
    });
  }, 3, 200);

  const prefs = parseUserPreferences(userPreference?.preferences);
  const raw = prefs.appointmentList;
  const data: AppointmentListPreference | null = isAppointmentListPreference(raw) ? raw : null;

  return { 
    message: "Preference fetched.", 
    data,
  };
});

export const upsertAppointmentListPreferenceAction = withErrorHandling(async (preference: AppointmentListPreference) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prisma.user.findUniqueOrThrow({ where: { userId: session.user.sub }, select: { id: true } });
  
  await withRetry(async () => {
    // Read existing preferences to merge, then update only the appointmentList key
    const existing = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { preferences: true },
    });
    const merged: UserPreferences = {
      ...parseUserPreferences(existing?.preferences),
      appointmentList: preference,
    };

    return await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, preferences: merged },
      update: { preferences: merged },
    });
  }, 3, 200);

  return { message: "Appointment list preference saved.", data: preference };
});
