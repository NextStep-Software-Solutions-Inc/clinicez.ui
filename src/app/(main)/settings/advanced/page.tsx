import { Separator } from "@components/ui/separator";
import React from "react";
import AdvancedSettingsForm from "./AdvancedSettingsForm";

export default function AdvancedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Advanced Settings</h3>
        <p className="text-sm text-muted-foreground">
          Advanced settings for your account.
        </p>
      </div>
      <Separator />
      <AdvancedSettingsForm />
    </div>
  )
}
