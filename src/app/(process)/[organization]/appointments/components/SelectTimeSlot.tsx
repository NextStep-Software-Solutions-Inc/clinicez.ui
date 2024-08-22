"use client";

import React from "react";
import FilterForm from "./FilterForm";
import AppointmentCalendar from "./AppointmentCalendar";
import { Separator } from "@components/ui/separator";
import VacantTimeSlot from "./VacantTimeSlot";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useAtomValue } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";

interface SelectTimeSlotProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}
export default function SelectTimeSlot({nextStep, prevStep, isFirstStep, isLastStep}: SelectTimeSlotProps) {
  const bookAppointment = useAtomValue(bookAppointmentAtom);
  const valid = !!bookAppointment.appointmentTypeId && !!bookAppointment.serviceId && !!bookAppointment.selectedTimeSlot;
  const handleNext = () => {
    nextStep?.();
  }
  return (
    <div className="prose max-w-full shadow-lg w-full p-8 bg-white rounded-md overflow-y-auto h-[calc(50dvh)] no-scrollbar scrollbox">
      <h2>Pick your time slot</h2>
      <div className="flex lg:flex-row flex-col items-center gap-5 justify-center my-5">
        <FilterForm/>
        <AppointmentCalendar/>
      </div>
      <Separator/>
      <VacantTimeSlot/>
      <div className="mt-5">
        <BackSubmitAndNext 
          disabled={{
            submit: true,
            previous: isFirstStep,
            next: !valid
          }}
          actions={{
            next: handleNext,
            previous: prevStep
          }}/>
      </div>
    </div>
  );
}
