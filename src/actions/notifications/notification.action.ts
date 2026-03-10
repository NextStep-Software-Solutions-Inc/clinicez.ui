"use server";

import prismaClient from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { NotificationType, Prisma } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateNotificationPayload = {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
};

export type GetNotificationsResult = Awaited<ReturnType<typeof getNotificationsAction>>;

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Internal server-side helper (not exported as a server action).
 * Call this from other server actions to persist a notification.
 * Skips delivery if the recipient has muted notifications.
 */
export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<void> {
  try {
    // Skip if the user has muted notifications
    const pref = await prismaClient.userPreference.findUnique({
      where: { userId: payload.userId },
      select: { muteNotifications: true },
    });
    if (pref?.muteNotifications) return;

    await prismaClient.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        metadata: payload.metadata,
      },
    });
  } catch (error) {
    // Notifications are non-critical — log and continue
    console.error("[createNotification] Failed to create notification:", error);
  }
}

/**
 * Create notifications for multiple recipients in bulk.
 * Skips delivery for recipients who have muted notifications.
 * Ignores failures so callers are not disrupted.
 */
export async function createNotifications(
  payloads: CreateNotificationPayload[],
): Promise<void> {
  if (!payloads.length) return;
  try {
    // Filter out users who have muted notifications
    const userIds = [...new Set(payloads.map((p) => p.userId))];
    const mutedPrefs = await prismaClient.userPreference.findMany({
      where: { userId: { in: userIds }, muteNotifications: true },
      select: { userId: true },
    });
    const mutedUserIds = new Set(mutedPrefs.map((p) => p.userId));

    const activePayloads = payloads.filter((p) => !mutedUserIds.has(p.userId));
    if (!activePayloads.length) return;

    await prismaClient.notification.createMany({
      data: activePayloads.map((p) => ({
        userId: p.userId,
        type: p.type,
        title: p.title,
        message: p.message,
        link: p.link,
        metadata: p.metadata,
      })),
    });
  } catch (error) {
    console.error("[createNotifications] Failed to create notifications:", error);
  }
}

// ── Public server actions ─────────────────────────────────────────────────────

/**
 * Fetch recent notifications for the currently authenticated user.
 * Returns the 30 most recent notifications, newest first.
 */
export const getNotificationsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prismaClient.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  const notifications = await prismaClient.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      isRead: true,
      createdAt: true,
    },
  });

  return { message: "Notifications fetched", data: notifications };
});

/**
 * Get the count of unread notifications for the current user.
 */
export const getUnreadNotificationCountAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prismaClient.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  const count = await prismaClient.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return { message: "Unread count fetched", data: count };
});

/**
 * Mark a single notification as read.
 */
export const markNotificationReadAction = withErrorHandling(
  async (notificationId: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const user = await prismaClient.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
      select: { id: true },
    });

    await prismaClient.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: "Notification marked as read", data: undefined };
  },
);

/**
 * Mark all notifications for the current user as read.
 */
export const markAllNotificationsReadAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prismaClient.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  await prismaClient.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { message: "All notifications marked as read", data: undefined };
});

/**
 * Dismiss (delete) a single notification for the current user.
 */
export const deleteNotificationAction = withErrorHandling(
  async (notificationId: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const user = await prismaClient.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
      select: { id: true },
    });

    await prismaClient.notification.deleteMany({
      where: { id: notificationId, userId: user.id },
    });

    return { message: "Notification dismissed", data: undefined };
  },
);

/**
 * Delete all read notifications for the current user.
 */
export const deleteAllReadNotificationsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prismaClient.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  await prismaClient.notification.deleteMany({
    where: { userId: user.id, isRead: true },
  });

  return { message: "Read notifications cleared", data: undefined };
});

/**
 * Toggle the muteNotifications preference for the current user.
 * Creates the preference record if it does not exist.
 */
export const toggleMuteNotificationsAction = withErrorHandling(
  async (mute: boolean) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const user = await prismaClient.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
      select: { id: true },
    });

    await prismaClient.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, muteNotifications: mute },
      update: { muteNotifications: mute },
    });

    return {
      message: mute ? "Notifications muted" : "Notifications unmuted",
      data: mute,
    };
  },
);

/**
 * Get the current muteNotifications preference for the current user.
 */
export const getMuteNotificationsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const user = await prismaClient.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  const pref = await prismaClient.userPreference.findUnique({
    where: { userId: user.id },
    select: { muteNotifications: true },
  });

  return { message: "Mute preference fetched", data: pref?.muteNotifications ?? false };
});
