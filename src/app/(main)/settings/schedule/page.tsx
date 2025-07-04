import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import React from "react";
import ScheduleSettings from "./ScheduleSettings";

export const metadata: Metadata = {
  title: "Schedule | Account Settings",
  description: "Schedule Settings",
};

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Declare your availability and manage your schedule.
        </p>
      </div>
      <Separator />
      <Suspend>
        <ScheduleSettings />
      </Suspend>
    </div>
  )
}
