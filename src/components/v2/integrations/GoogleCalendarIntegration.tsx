"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Calendar, Video, Mail } from "lucide-react";
import { getGoogleAuthUrl, disconnectGoogleCalendar } from "@/actions/google/auth.action";

interface GoogleCalendarIntegrationProps {
  connected: boolean;
  /** Google email address that is currently connected, if known. */
  email?: string | null;
}

export function GoogleCalendarIntegration({ connected, email }: GoogleCalendarIntegrationProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConnect = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const result = await getGoogleAuthUrl(`${baseUrl}/api/google/code`);
    if (result.status && result.data) {
      window.location.href = result.data;
    } else {
      toast.error(result.message);
    }
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectGoogleCalendar();
      if (result.success) {
        toast.success("Google Calendar disconnected.");
        router.refresh();
      } else {
        toast.error("Failed to disconnect Google Calendar.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Sync your appointments with Google Calendar and join virtual consultations directly from your calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 py-2">
          {connected ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium text-green-600">Connected</span>
                {email && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{email}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Not connected</span>
            </>
          )}
        </div>

        {/* Features list */}
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Confirmed appointments are automatically added to your Google Calendar with all attendees notified.</span>
          </li>
          <li className="flex items-start gap-2">
            <Video className="h-4 w-4 mt-0.5 text-purple-500 flex-shrink-0" />
            <span>Virtual appointments include a Google Meet link so you can join with a single click.</span>
          </li>
          <li className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Rescheduled appointments automatically update the calendar event.</span>
          </li>
        </ul>

        {/* Action */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
          {connected ? (
            <>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isPending}
                size="sm"
              >
                {isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
              <Button
                variant="outline"
                onClick={handleConnect}
                disabled={isPending}
                size="sm"
              >
                Reconnect with another account
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} size="sm">
              Connect Google Calendar
            </Button>
          )}
        </div>

        {connected && (
          <p className="text-xs text-muted-foreground">
            Disconnecting will prevent future appointments from being added to Google Calendar. Existing calendar events will not be removed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
