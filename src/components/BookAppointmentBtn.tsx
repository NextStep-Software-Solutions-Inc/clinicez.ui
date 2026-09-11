"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "@/styles/shiny-button.css";

type BookAppointmentBtnProps = Readonly<{
  className?: string;
  children?: React.ReactNode;
  userId?: string;
  clinicUid: string;
}>;

/**
 * @deprecated Legacy booking trigger. Now routes to modern V2 booking wizard at /v2/book-appointment?clinic=[clinicUid]
 */
export default function BookAppointmentBtn({
  className,
  children,
  clinicUid,
}: BookAppointmentBtnProps) {
  const router = useRouter();

  const handleOpenBooking = () => {
    router.push(`/v2/book-appointment?clinic=${clinicUid}`);
  };

  return (
    <div onClick={handleOpenBooking} className="cursor-pointer">
      {children ? (
        children
      ) : (
        <button className={className} type="button">
          Book Appointment
        </button>
      )}
    </div>
  );
}
