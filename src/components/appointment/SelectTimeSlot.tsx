"use client";

import React, { useEffect, useMemo } from "react";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import dayjs from "@lib/day-utils";
import { useTimeSlots } from "@hooks/useTimeSlots";
import { BarLoader } from "react-spinners";
import { Info } from "lucide-react";

interface SelectTimeSlotProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}
export default function SelectTimeSlot({nextStep, prevStep, isFirstStep, isLastStep}: SelectTimeSlotProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const handleNext = () => {
    nextStep?.();
  }
  const { appointmentTypeId, serviceId, hpUserId, hpId } = bookAppointmentForm;
  const {data: timeSlots, isValidating} = useTimeSlots({
    appointmentTypeId,
    userId: hpUserId ?? "",
    hpId: Number(hpId),
    serviceId,
  });

  const availableDates = useMemo(() => isValidating ? [] : timeSlots?.data?.filter(a => a.status).map(a => dayjs(a.date).startOf("day").toDate()), [isValidating, timeSlots?.data]) ?? []
  const availableTimeSlots = useMemo(() => isValidating ? [] : timeSlots?.data?.find(a => dayjs(a.date).isSame(bookAppointmentForm.preferredDate, "day"))?.timeSlots.map(timeSlot => ({
    start: dayjs(timeSlot.start).toDate(),
    end: dayjs(timeSlot.end).toDate(),
  })), [isValidating, timeSlots?.data, bookAppointmentForm.preferredDate]) ?? []

  console.log({availableTimeSlots});
  
  return (
    <div className="shadow-lg w-full p-8 bg-white rounded-md">
      <h5 className="text-lg font-semibold">Pick Time Slot (optional)</h5>
      <div className="overflow-y-auto max-h-[calc(50dvh)] no-scrollbar scrollBox">
        <Alert className="my-5">
          <Info className="h-4 w-4" />
          <AlertTitle>
            Time slots refresh every minute to show the most up-to-date availability.
          </AlertTitle>
          <AlertDescription>
            Once you have selected a time slot, you have 1 minute to complete the booking process. If you do not complete the booking within a minute, the time slot will be released and made available to other patients.
          </AlertDescription>
        </Alert>
        {
          (!bookAppointmentForm.hpUserId || !bookAppointmentForm.hpId) &&
          <Alert className="my-5 bg-destructive/15">
            <Info className="h-4 w-4" />
            <AlertTitle>
            No Healthcare Provider Selected
            </AlertTitle>
            <AlertDescription>
            You can skip this step and continue to the next step. You can always come back to this step to select a time slot.
            </AlertDescription>
          </Alert>
        }
        {isValidating && <BarLoader className="min-w-full my-2" color="teal"/>}
        <div className="flex lg:flex-row flex-col items-center gap-5 justify-center my-5">
          <AppointmentCalendar
            availableDates={availableDates}
            preferredDate={bookAppointmentForm.preferredDate}
            onSelect={(date) => {
              setBookAppointmentForm((prev) => ({...prev, preferredDate: date, selectedTimeSlot: undefined}))
            }}
          />
          <VacantTimeSlot
            timeSlots={availableTimeSlots}
            selectedTimeSlot={bookAppointmentForm.selectedTimeSlot}
            onSelect={(timeSlot) => setBookAppointmentForm((prev) => ({...prev, selectedTimeSlot: timeSlot}))} 
          />
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
