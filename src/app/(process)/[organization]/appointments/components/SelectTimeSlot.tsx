"use client";

import React, { useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useAtom, useAtomValue } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { toast } from "sonner";
import { getHPsTimeSlots } from "@actions/schedule/time-slot.actions";
dayjs.extend(utc)

interface SelectTimeSlotProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}
export default function SelectTimeSlot({nextStep, prevStep, isFirstStep, isLastStep}: SelectTimeSlotProps) {
  const [bookAppointment, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const handleNext = () => {
    nextStep?.();
  }
  const { appointmentTypeId, serviceId, hpEmail } = bookAppointment;
  useEffect(() => {

    if(!appointmentTypeId || !serviceId || !hpEmail) {
      toast.error("Unable to fetch time slots. Required fields are missing.");
      return;
    }

    const loadTimeSlots = () => {
      setBookAppointmentForm((prev) => ({
        ...prev,
        availabilities: [],
        selectedTimeSlot: undefined,
        preferredDate: undefined
      }));
      toast.promise(getHPsTimeSlots({
        appointmentTypeId: appointmentTypeId,
        serviceId: serviceId,
        hpEmail: hpEmail
      }), {
        position: "top-center",
        loading: "Refreshing time slots...",
        success: (res) => {
          setBookAppointmentForm((prev) => ({
            ...prev,
            availabilities: res.data
          }));
          return res.message;
        },
        error: "Failed to refresh time slots."
      })
    };
    
    loadTimeSlots();
    const interval = setInterval(() => {
      loadTimeSlots();
    }, 300000);

    return () => clearInterval(interval);
  }, [appointmentTypeId, serviceId, hpEmail, setBookAppointmentForm])

  return (
    <div className="shadow-lg w-full p-8 bg-white rounded-md">
      <h5 className="text-lg font-semibold">Pick Time Slot (optional)</h5>
      <div className="overflow-y-auto max-h-[calc(50dvh)] no-scrollbar scrollBox">
        <Alert className="my-5">
          <AlertTitle>
            Time slots refresh every 5 minutes to show the most up-to-date availability.
          </AlertTitle>
          <AlertDescription>
            Once you have selected a time slot, you have 5 minutes to complete the booking process. If you do not complete the booking within 5 minutes, the time slot will be released and made available to other patients.
          </AlertDescription>
        </Alert>
        <div className="flex lg:flex-row flex-col items-center gap-5 justify-center my-5">
          <AppointmentCalendar/>
          <VacantTimeSlot/>
        </div>
      </div>
      <form className="mt-5" onSubmit={handleNext}>
        <BackSubmitAndNext 
          disabled={{
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
