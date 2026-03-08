"use client"
import { toast } from "sonner"
import ActionButton from "@components/ActionButton"
import Each from "@components/utils/Each"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card"
import { getGoogleAuthUrl, disconnectGoogleCalendar } from "@actions/google/auth.action"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

interface UserPreferenceFormProps {
  integrations: {
    name: string,
    status: boolean,
  }[]
}

const apps = [
  {
    name: "Google Calendar",
    description: "Sync your appointments to Google Calendar and create Google Meet links for virtual consultations.",
  },
]

export default function Integrations({ integrations = [] }: UserPreferenceFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConnect = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
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
    <div>
      <Each
        of={apps}
        render={(app, index) => {
          const integration = integrations[index];
          const isConnected = integration?.status ?? false;
          return (
            <Card key={index} className="p-4">
              <CardHeader>
                <CardTitle>
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span>{app.name}</span>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDisconnect}
                          disabled={isPending}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" onClick={handleConnect}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not connected</span>
                    </>
                  )}
                </div>
                {isConnected && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Appointments confirmed by your clinic will automatically be added to your Google Calendar. Virtual appointments include a Google Meet link.
                  </p>
                )}
              </CardContent>
              <CardFooter />
            </Card>
          );
        }}
      />
    </div>
  )
}
