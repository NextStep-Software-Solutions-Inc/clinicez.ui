import Suspend from "@/components/Suspend";
import BookAppointmentSheet from "@/components/appointment/BookAppointmentSheet";
import { JoinAsPatientDialog } from "@/components/appointment/JoinAsPatientDialog";
import React from "react";

export default function ClinicLayout({children}: Readonly<{children: React.ReactNode;}>) {
  return <>
    {children}
    <Suspend>
      <BookAppointmentSheet/>
      <JoinAsPatientDialog/>
    </Suspend>
  </>;
}
