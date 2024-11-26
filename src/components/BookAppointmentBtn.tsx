"use client";

import React from "react";
import "@/styles/shiny-button.css";

export default function BookAppointmentBtn({className, children}: Readonly<{className?: string; children?: React.ReactNode}>) {

  const handleBookAppointment = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("book-appointment", "true");
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
