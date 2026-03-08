import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { GoogleCalendarIntegration } from "@/components/v2/integrations/GoogleCalendarIntegration";
import { checkGoogleCalendarAccess } from "@/actions/google/auth.action";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Manage your app integrations",
};

// Force dynamic rendering so Google Calendar connection status is always fresh
// (avoids stale cached responses showing wrong connected state)
export const dynamic = "force-dynamic";

export default async function PatientIntegrationsPage() {
  const { connected, email } = await checkGoogleCalendarAccess();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect third-party apps to enhance your ClinicEZ experience.
        </p>
      </div>
      <Separator />
      <GoogleCalendarIntegration connected={connected} email={email} />
    </div>
  );
}
