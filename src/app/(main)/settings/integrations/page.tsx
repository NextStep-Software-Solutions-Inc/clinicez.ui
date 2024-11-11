import { Separator } from "@components/ui/separator";
import React from "react";
import Integrations from "./Integrations";
import { Metadata } from "next";
import { getMyUserPreferenceAction } from "@actions/users/preference.action";
import { getGoogleAccessToken } from "@actions/google/auth.action";

export const metadata: Metadata = {
  title: "Intergrations | Account Settings",
  description: "Account integrations settings",
};

export default async function IntegrationsPage() {
  const googleToken = await getGoogleAccessToken()
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Manage apps and 3rd party integrations
        </p>
      </div>
      <Separator />
      <Integrations intergrations={[{
        name: "Google Calendar",
        status: !!googleToken
      }]}/>
    </div>
  )
}
