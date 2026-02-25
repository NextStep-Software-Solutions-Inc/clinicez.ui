/**
 * Server-Sent Events endpoint for real-time notification push.
 *
 * The client connects once; the server streams "ping" heartbeats every 25 s
 * and a "notifications" event whenever the user's unread count or total
 * notification list changes (checked every 5 s).
 *
 * Vercel Edge / Node: this uses the standard Streams API supported by both.
 * The connection is kept alive until the client disconnects or a 55-second
 * inactivity timeout fires (safe under Vercel's 60-second limit).
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 5_000;   // check DB every 5 s
const HEARTBEAT_INTERVAL_MS = 25_000; // keep-alive ping every 25 s
const MAX_DURATION_MS = 55_000;   // close gracefully before Vercel 60 s limit

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Resolve internal integer user id
  const user = await prisma.user.findUnique({
    where: { userId: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const userId = user.id;

  // ── SSE stream ──────────────────────────────────────────────────────────────
  let closed = false;
  let lastSnapshot: string | null = null; // serialised (id, isRead) pairs for change detection

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${data}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      // Helper: fetch latest notifications and push if changed
      const pushIfChanged = async () => {
        if (closed) return;
        try {
          const notifications = await prisma.notification.findMany({
            where: { userId },
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

          // Build a compact snapshot string for change detection
          const snapshot = notifications
            .map((n) => `${n.id}:${n.isRead ? 1 : 0}`)
            .join(",");

          if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot;
            send("notifications", JSON.stringify(notifications));
          }
        } catch {
          // DB error — skip this tick
        }
      };

      // Send initial state immediately
      await pushIfChanged();

      // Poll DB every POLL_INTERVAL_MS
      const pollTimer = setInterval(pushIfChanged, POLL_INTERVAL_MS);

      // Heartbeat to prevent proxy/load-balancer timeouts
      const heartbeatTimer = setInterval(() => {
        send("ping", "{}");
      }, HEARTBEAT_INTERVAL_MS);

      // Auto-close before Vercel function timeout; client will reconnect
      const closeTimer = setTimeout(() => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try { controller.close(); } catch { /* already closed */ }
      }, MAX_DURATION_MS);

      // Handle client disconnect via abort signal
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        clearTimeout(closeTimer);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx buffering
    },
  });
}
