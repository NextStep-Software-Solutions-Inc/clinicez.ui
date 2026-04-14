import type { Metadata } from "next";
import { GoogleCalendarIntegration } from "@/components/v2/integrations/GoogleCalendarIntegration";
import { CalendarEventsList } from "@/components/v2/integrations/CalendarEventsList";
import { checkGoogleCalendarAccess, getCalendarEvents } from "@/actions/google/auth.action";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Manage your app integrations",
};

// Force dynamic rendering so Google Calendar connection status is always fresh
// (avoids stale cached responses showing wrong connected state)
export const dynamic = "force-dynamic";

export default async function PatientIntegrationsPage() {
  const { connected, email } = await checkGoogleCalendarAccess();
  const events = connected ? await getCalendarEvents(20) : [];

  return (
    <div className="w-full space-y-6 pt-2">
      {/* Section header */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Connected Services
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Connect third-party apps to enhance your ClinicEZ experience.
        </p>
      </div>

      {/* Integration rows */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <GoogleCalendarIntegration connected={connected} email={email} />
      </div>

      {/* Calendar events if connected */}
      {connected && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Upcoming Events
          </h2>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <CalendarEventsList events={events} />
          </div>
        </div>
      )}
    </div>
  );
}

