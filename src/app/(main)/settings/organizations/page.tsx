import { Separator } from "@components/ui/separator";
import React from "react";
import OrganizationsSettings from "./OrganizationsSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Organizations | Clinic EZ",
  description: "Organization Settings",
};

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organizations</h3>
        <p className="text-sm text-muted-foreground">
          Organization settings for your account.
        </p>
      </div>
      <Separator />
      <OrganizationsSettings />
    </div>
  )
}
