"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications/notification.action";
import type { GetNotificationsResult } from "@/actions/notifications/notification.action";
import { NotificationType } from "@prisma/client";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Fallback polling interval when SSE is unavailable */
const FALLBACK_POLL_INTERVAL_MS = 30_000;
/** URL of the SSE stream endpoint */
const SSE_ENDPOINT = "/api/notifications/stream";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationItem = NonNullable<
  NonNullable<GetNotificationsResult["data"]>[number]
>;

// ── Icon map ──────────────────────────────────────────────────────────────────

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: "📅",
  APPOINTMENT_CONFIRMED: "✅",
  APPOINTMENT_CANCELLED: "❌",
  APPOINTMENT_REJECTED: "🚫",
  APPOINTMENT_COMPLETED: "🏁",
  APPOINTMENT_RESCHEDULED: "🔄",
  APPOINTMENT_RECEIVED: "📋",
  CONSULTATION_STARTED: "🩺",
  CONSULTATION_COMPLETED: "✔️",
  DIAGNOSTIC_ISSUED: "🔬",
  PRESCRIPTION_ISSUED: "💊",
  MEDICAL_CERTIFICATE_ISSUED: "📄",
  REFERRAL_ISSUED: "🏥",
  ORG_MEMBERSHIP_APPLIED: "📝",
  ORG_MEMBERSHIP_APPROVED: "🎉",
  ORG_MEMBERSHIP_REJECTED: "⛔",
  ORG_MEMBERSHIP_SUSPENDED: "⏸️",
  ORG_MEMBERSHIP_DEACTIVATED: "🔒",
  FILE_SHARED: "📁",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for SSE and fallback polling cleanup
  const esRef = useRef<EventSource | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Fetch via server action (used as fallback + on-demand) ─────────────────
  const fetchNotifications = useCallback(async () => {
    const result = await getNotificationsAction();
    if (result.status && result.data) {
      setNotifications(result.data);
    }
  }, []);

  // ── SSE helpers ────────────────────────────────────────────────────────────
  const stopSSE = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  const stopFallback = useCallback(() => {
    if (fallbackRef.current) {
      clearInterval(fallbackRef.current);
      fallbackRef.current = null;
    }
  }, []);

  const startSSE = useCallback(() => {
    // Don't open a second connection
    if (esRef.current) return;

    const es = new EventSource(SSE_ENDPOINT);
    esRef.current = es;

    es.addEventListener("notifications", (ev) => {
      try {
        const data = JSON.parse(ev.data) as NotificationItem[];
        setNotifications(data);
      } catch {
        // malformed payload — ignore
      }
    });

    // "ping" events keep the connection alive — no action needed
    es.addEventListener("ping", () => {});

    es.onerror = () => {
      // Connection dropped — close, start fallback polling, and schedule reconnect
      stopSSE();
      if (!fallbackRef.current) {
        fetchNotifications(); // immediate fetch
        fallbackRef.current = setInterval(fetchNotifications, FALLBACK_POLL_INTERVAL_MS);
      }
      // Reconnect after 5 s (server closes at ~55 s; client reconnects naturally)
      reconnectRef.current = setTimeout(() => {
        stopFallback();
        startSSE();
      }, 5_000);
    };

    es.onopen = () => {
      // SSE connected — stop fallback polling if it was running
      stopFallback();
    };
  }, [fetchNotifications, stopSSE, stopFallback]);

  // ── Bootstrap SSE on mount ─────────────────────────────────────────────────
  useEffect(() => {
    // EventSource is not available in SSR
    if (typeof EventSource === "undefined") {
      // Fallback: plain polling
      fetchNotifications();
      fallbackRef.current = setInterval(fetchNotifications, FALLBACK_POLL_INTERVAL_MS);
      return () => stopFallback();
    }

    startSSE();
    return () => {
      stopSSE();
      stopFallback();
    };
  }, [startSSE, stopSSE, stopFallback, fetchNotifications]);

  // ── Refresh on popover open ────────────────────────────────────────────────
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    await markNotificationReadAction(id);
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsReadAction();
    setIsLoading(false);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg hover:bg-muted"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                "bg-red-500 text-white border-0 pointer-events-none",
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-lg"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isLoading}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">You&apos;re all caught up!</p>
              <p className="text-xs opacity-70">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                    !notification.isRead && "bg-accent/5",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <span
                    className="mt-0.5 shrink-0 text-lg leading-none"
                    aria-hidden
                  >
                    {NOTIFICATION_ICONS[notification.type] ?? "🔔"}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        !notification.isRead
                          ? "font-semibold text-foreground"
                          : "text-foreground/80",
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Right-side actions */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    {notification.link && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notification.id);
                        }}
                        aria-label="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              Showing last {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
