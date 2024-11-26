import Suspend from "@/components/Suspend";
import BookAppointmentSheet from "@/components/appointment/BookAppointmentSheet";
import React from "react";

export default function ClinicLayout({children}: Readonly<{children: React.ReactNode;}>) {
  return <>
    {children}
    <Suspend>
      <BookAppointmentSheet/>
    </Suspend>
  </>;
}
