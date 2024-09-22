"use client";

import React from "react";
import FilterForm from "./FilterForm";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useAtomValue } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Badge } from "@components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)


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
    <div className="shadow-lg w-full p-8 bg-white rounded-md ">
      <Accordion type="single" defaultValue="filter" collapsible className="w-full">
        <AccordionItem value="filter">
          <AccordionTrigger>Select a Date</AccordionTrigger>
          <AccordionContent className="overflow-y-auto max-h-[calc(50dvh)] no-scrollbar scrollBox px-2">
            <Alert>
              <AlertTitle>
          Select Appointment Type, Service, and Doctor to view available time slots
              </AlertTitle>
              <AlertDescription>
          The time slots will be displayed here once you have selected the appointment type, service, and doctor. <br />
          Click <Badge>Find time slots</Badge> to view available time slots.
              </AlertDescription>
            </Alert>
            <div className="flex lg:flex-row flex-col items-center gap-5 justify-center my-5">
              <FilterForm/>
              <AppointmentCalendar/>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="time-slot">
          <AccordionTrigger>
            <div>
              Pick a time slot for: <span className="font-bold italic">{bookAppointment.preferredDate? dayjs(bookAppointment.preferredDate).format("ll") : "No date selected!"}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <VacantTimeSlot/>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <form className="mt-5" onSubmit={handleNext}>
        <BackSubmitAndNext 
          disabled={{
            submit: !valid,
            previous: isFirstStep,
            next: true
          }}
          labels={{
            submit: "Next",
          }}
          actions={{
            next: handleNext,
            previous: prevStep,
          }}/>
      </form>
    </div>
  );
}
