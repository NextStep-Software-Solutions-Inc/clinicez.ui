/**
 * This SSE endpoint has been retired to eliminate long-running Vercel function
 * costs. Notifications are now delivered via client-side polling in
 * NotificationBell using the getNotificationsAction server action.
 *
 * Returning 410 Gone so any cached clients fail fast without holding an open
 * connection.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(
    JSON.stringify({
      message:
        "This SSE endpoint has been retired. Notifications are now delivered via client-side polling.",
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    },
  );
}
