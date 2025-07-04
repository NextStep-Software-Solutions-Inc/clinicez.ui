"use client"

import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { Separator } from "@components/ui/separator";
import React from "react";
const ScheduleSettingsForm = dynamic(() => import("./ScheduleSettingsForm"), { ssr: false });

export default function ScheduleSettingsPage() {
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
        <ScheduleSettingsForm />
      </Suspend>
    </div>
  )
}
