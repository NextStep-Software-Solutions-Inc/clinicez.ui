"use client";

import React from "react";
import "@/styles/shiny-button.css";
import { useClinicPatients } from "@/hooks/useClinicPatient";
import { toast } from "sonner";

type BookAppointmentBtnProps = Readonly<{
    className?: string;
    children?: React.ReactNode;
    userId: string;
    clinicUid: string;
}>

export default function BookAppointmentBtn({className, children, userId, clinicUid}: BookAppointmentBtnProps) {
  const {data: clinicPatient, isLoading} = useClinicPatients({
    clinicUid, userId
  })

  const handleOpenBooking = () => {
    if (isLoading) {
      toast.info("Please wait while we check your eligibility to book an appointment");
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if(!clinicPatient?.data?.length) {
      searchParams.set("join-as-patient", "true");
    } else {
      searchParams.set("book-appointment", "true");
    }
    window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div onClick={handleOpenBooking}>
      {
        children ? children :
          <button className={className} > 
            Book Appointment
          </button>
      }
    </div>
    
  );
}
