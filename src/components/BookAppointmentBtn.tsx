"use client";

import React from "react";
import "@/styles/shiny-button.css";
import { useClinicPatients } from "@/hooks/useClinicPatient";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function BookAppointmentBtn({className, children}: Readonly<{className?: string; children?: React.ReactNode}>) {
  const {clinicUid} = useParams<{clinicUid: string}>();

  const {data: clinicPatient, isLoading} = useClinicPatients({
    clinicUid
  })

  const handleBookAppointment = () => {
    const searchParams = new URLSearchParams(window.location.search);
    
    const isPatient = !!clinicPatient?.data?.length;

    if(!isPatient) {
      searchParams.set("join-as-patient", "true");
    } else {
      searchParams.set("book-appointment", "true");
    }

    window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
  }

  return (
    <div onClick={handleBookAppointment}>
      {
        children ? children :
          <button className={className} > 
            Book Appointment
          </button>
      }
    </div>
    
  );
}
