import { Separator } from "@components/ui/separator";
import React from "react";
import AdvancedSettingsForm from "./AdvancedSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pending Appointments",
  description: "Pending your appointments from your organizations.",
};

export default function PendingAppointmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          Pending Appointments
        </h3>
        <p className="text-sm text-muted-foreground">
          Pending your appointments from your organizations.
        </p>
      </div>
      <Separator />
      <AdvancedSettingsForm />
    </div>
  )
}
