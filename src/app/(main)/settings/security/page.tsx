import SecuritySettingsForm from "./SecuritySettingsForm";
import { Separator } from "@components/ui/separator";
import React from "react";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Security settings for your account.
        </p>
      </div>
      <Separator />
      <SecuritySettingsForm />
    </div>
  )
}
