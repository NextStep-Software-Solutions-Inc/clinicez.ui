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
 */
export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<void> {
  try {
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
 * Ignores failures so callers are not disrupted.
 */
export async function createNotifications(
  payloads: CreateNotificationPayload[],
): Promise<void> {
  if (!payloads.length) return;
  try {
    await prismaClient.notification.createMany({
      data: payloads.map((p) => ({
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
