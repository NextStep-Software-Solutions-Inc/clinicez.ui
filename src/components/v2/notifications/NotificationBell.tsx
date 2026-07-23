"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, Check, CheckCheck, ExternalLink, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import useBreakpoints from "@/hooks/useBreakpoints";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  deleteNotificationAction,
  deleteAllReadNotificationsAction,
  getMuteNotificationsAction,
  toggleMuteNotificationsAction,
} from "@/actions/notifications/notification.action";
import type { GetNotificationsResult } from "@/actions/notifications/notification.action";
import { type NotificationType, NOTIFICATION_TYPE } from "@/lib/notification-types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** How often to poll the server for new notifications */
const POLL_INTERVAL_MS = 30_000;

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationItem = NonNullable<
  NonNullable<GetNotificationsResult["data"]>[number]
>;

// ── Icon map ──────────────────────────────────────────────────────────────────

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NOTIFICATION_TYPE.APPOINTMENT_CREATED]: "📅",
  [NOTIFICATION_TYPE.APPOINTMENT_CONFIRMED]: "✅",
  [NOTIFICATION_TYPE.APPOINTMENT_CANCELLED]: "❌",
  [NOTIFICATION_TYPE.APPOINTMENT_REJECTED]: "🚫",
  [NOTIFICATION_TYPE.APPOINTMENT_COMPLETED]: "🏁",
  [NOTIFICATION_TYPE.APPOINTMENT_RESCHEDULED]: "🔄",
  [NOTIFICATION_TYPE.APPOINTMENT_RECEIVED]: "📋",
  [NOTIFICATION_TYPE.CONSULTATION_STARTED]: "🩺",
  [NOTIFICATION_TYPE.CONSULTATION_COMPLETED]: "✔️",
  [NOTIFICATION_TYPE.DIAGNOSTIC_ISSUED]: "🔬",
  [NOTIFICATION_TYPE.PRESCRIPTION_ISSUED]: "💊",
  [NOTIFICATION_TYPE.MEDICAL_CERTIFICATE_ISSUED]: "📄",
  [NOTIFICATION_TYPE.REFERRAL_ISSUED]: "🏥",
  [NOTIFICATION_TYPE.ORG_MEMBERSHIP_APPLIED]: "📝",
  [NOTIFICATION_TYPE.ORG_MEMBERSHIP_APPROVED]: "🎉",
  [NOTIFICATION_TYPE.ORG_MEMBERSHIP_REJECTED]: "⛔",
  [NOTIFICATION_TYPE.ORG_MEMBERSHIP_SUSPENDED]: "⏸️",
  [NOTIFICATION_TYPE.ORG_MEMBERSHIP_DEACTIVATED]: "🔒",
  [NOTIFICATION_TYPE.ORG_MEMBERSHIP_COMPLY_REQUESTED]: "📋",
  [NOTIFICATION_TYPE.FILE_SHARED]: "📁",
  [NOTIFICATION_TYPE.VERIFICATION_SUBMITTED]: "🆔",
  [NOTIFICATION_TYPE.VERIFICATION_APPROVED]: "✅",
  [NOTIFICATION_TYPE.VERIFICATION_REJECTED]: "🚫",
  [NOTIFICATION_TYPE.VERIFICATION_RESET]: "🔄",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter();
  const { sm, md } = useBreakpoints();
  const isMobile = sm || md; // covers viewports < 768px (phones + portrait tablets)
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [limit, setLimit] = useState(50);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Ref for the polling interval
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard to prevent concurrent in-flight fetches
  const isFetchingRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  // ── Fetch via server action ────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (requestedLimit?: number) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const fetchLimit = requestedLimit ?? limit;
    try {
      const result = await getNotificationsAction(fetchLimit);
      if (result.status && result.data) {
        setNotifications(result.data);
        setHasMore(result.data.length >= fetchLimit);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [limit]);

  // ── Bootstrap polling on mount ─────────────────────────────────────────────
  useEffect(() => {
    // Load mute preference once on mount
    getMuteNotificationsAction().then((result) => {
      if (result.status && result.data !== null) {
        setIsMuted(result.data);
      }
    });

    // Initial fetch + periodic polling
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchNotifications]);

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

  const handleDismiss = async (id: number) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const result = await deleteNotificationAction(id);
    if (!result.status) {
      setNotifications(previous);
    }
  };

  const handleClearRead = async () => {
    setIsLoading(true);
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    const result = await deleteAllReadNotificationsAction();
    if (!result.status) {
      setNotifications(previous);
    }
    setIsLoading(false);
  };

  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await toggleMuteNotificationsAction(newMuted);
  };

  const handleLoadMore = async () => {
    const nextLimit = limit + 50;
    setLimit(nextLimit);
    setIsLoadingMore(true);
    await fetchNotifications(nextLimit);
    setIsLoadingMore(false);
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

  // ── Bell trigger button ────────────────────────────────────────────────────
  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      {isMuted ? (
        <BellOff className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      {unreadCount > 0 && !isMuted && (
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
  );

  // ── Shared panel content ───────────────────────────────────────────────────
  const panelContent = (
    <>
      {/* Muted banner */}
      {isMuted && (
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <BellOff className="h-3 w-3 shrink-0" />
          <span>Notifications are muted. New notifications will not appear.</span>
        </div>
      )}

      {/* List */}
      <ScrollArea className="h-[360px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-30" />
            <p className="text-sm">You&apos;re all caught up!</p>
            <p className="text-xs opacity-70">No notifications yet.</p>
          </div>
        ) : (
          <>
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
                    {NOTIFICATION_ICONS[notification.type as NotificationType] ?? "🔔"}
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
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notification.id);
                          }}
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        aria-label="Dismiss notification"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="p-2 text-center border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load more notifications"}
                </Button>
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </p>
          {readCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClearRead}
              disabled={isLoading}
              title="Remove all read notifications"
            >
              <Trash2 className="h-3 w-3" />
              Clear read
            </Button>
          )}
        </div>
      )}
    </>
  );

  // ── Header actions (shared between Sheet and Popover) ──────────────────────
  const headerActions = (
    <div className="flex items-center gap-1">
      {unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleMarkAllRead}
          disabled={isLoading}
          title="Mark all as read"
        >
          <CheckCheck className="h-3 w-3" />
          Mark all read
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleToggleMute}
        title={isMuted ? "Unmute notifications" : "Mute notifications"}
      >
        {isMuted ? (
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  // Mobile: bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{bellButton}</SheetTrigger>
        <SheetContent side="bottom" className="p-0 rounded-t-2xl max-h-[85vh] flex flex-col">
          <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3 pr-12 space-y-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <SheetTitle className="text-sm font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {headerActions}
          </SheetHeader>
          <div className="flex flex-col overflow-hidden flex-1">
            {panelContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{bellButton}</PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 p-0 shadow-lg"
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
          {headerActions}
        </div>
        {panelContent}
      </PopoverContent>
    </Popover>
  );
}
