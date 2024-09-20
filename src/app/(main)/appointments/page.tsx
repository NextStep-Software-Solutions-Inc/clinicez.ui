import { Separator } from "@components/ui/separator";
import React from "react";
import { Metadata } from "next";
import Suspend from "@components/Suspend";
import AppointmentListWrapper from "../../../components/Com";

export const metadata: Metadata = {
  title: "All Appointments",
  description: "Combination of all your appointments from your organizations.",
};

export default function AllAppointmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          All Appointments
        </h3>
        <p className="text-sm text-muted-foreground">
          Combination of all your appointments from your organizations.
        </p>
      </div>
      <Separator />
      <Suspend>
        <AppointmentListWrapper orgUid={"ustp-hims"}/>
      </Suspend>
    </div>
  )
}
