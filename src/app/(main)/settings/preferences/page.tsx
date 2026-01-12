import { Separator } from "@components/ui/separator";
import React from "react";
import UserPreferences from "./UserPreferences";
import { Metadata } from "next";
import { getMyUserPreferenceAction } from "@actions/users/preference.action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Preferences | Account Settings",
  description: "User preferences and account settings.",
};

export default async function PreferencesPage() {
  const userPreference = await getMyUserPreferenceAction()
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Manage your user preferences and account settings
        </p>
      </div>
      <Separator />
      <UserPreferences userPreference={userPreference.data} />
    </div>
  )
}
