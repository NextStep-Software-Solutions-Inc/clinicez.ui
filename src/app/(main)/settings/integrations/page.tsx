import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { Separator } from "@components/ui/separator";
import React from "react";
import Integrations from "./Integrations";
import { Metadata } from "next";
import { getGoogleAuthToken } from "@/actions/google/auth.action";
// import { getGoogleAccessToken } from "@actions/google/auth.action";

export const metadata: Metadata = {
  title: "Integrations | Account Settings",
  description: "Account integrations settings",
};

export default async function IntegrationsPage() {
  const googleToken = getGoogleAuthToken();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Manage apps and 3rd party integrations
        </p>
      </div>
      <Separator />
      <Integrations integrations={[{
        name: "Google Calendar",
        status: !!googleToken
      }]} />
    </div>
  )
}
