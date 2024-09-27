"use client";

import React, { useEffect, useMemo } from "react";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { toast } from "sonner";
import { getUserTimeSlotsAction } from "@actions/schedule/time-slot.actions";
import { useTimeSlots } from "@hooks/useTimeSlots";
import { BarLoader } from "react-spinners";
import { Info } from "lucide-react";
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
  const { appointmentTypeId, serviceId, hpUserId } = bookAppointment;
  const {data: timeSlots, isValidating} = useTimeSlots({
    appointmentTypeId,
    serviceId,
    userId: hpUserId ?? ""
  });

  // useEffect(() => {

  //   if(!appointmentTypeId || !serviceId || !hpUserId) {
  //     toast.error("Unable to fetch time slots. Required fields are missing.");
  //     return;
  //   }

  //   const loadTimeSlots = () => {
  //     setBookAppointmentForm((prev) => ({
  //       ...prev,
  //       availabilities: [],
  //       selectedTimeSlot: undefined,
  //       preferredDate: undefined
  //     }));
  //     toast.promise(getUserTimeSlotsAction({
  //       appointmentTypeId: appointmentTypeId,
  //       serviceId: serviceId,
  //       userId: hpUserId
  //     }), {
  //       position: "top-center",
  //       loading: "Refreshing time slots...",
  //       success: (res) => {
  //         setBookAppointmentForm((prev) => ({
  //           ...prev,
  //           availabilities: res.data
  //         }));
  //         return res.message;
  //       },
  //       error: "Failed to refresh time slots."
  //     })
  //   };
    
  //   loadTimeSlots();
  //   const interval = setInterval(() => {
  //     loadTimeSlots();
  //   }, 300000);

  //   return () => clearInterval(interval);
  // }, [appointmentTypeId, serviceId, hpUserId, setBookAppointmentForm])

  const availableDates = useMemo(() => isValidating ? [] : timeSlots?.data?.filter(a => a.status).map(a => dayjs(a.date).startOf("day").toDate()), [isValidating, timeSlots?.data]) ?? []
  const availableTimeSlots = useMemo(() => isValidating ? [] : timeSlots?.data?.find(a => dayjs(a.date).isSame(bookAppointment.preferredDate, "day"))?.timeSlots, [isValidating, timeSlots?.data, bookAppointment.preferredDate]) ?? []

  return (
    <div className="shadow-lg w-full p-8 bg-white rounded-md">
      <h5 className="text-lg font-semibold">Pick Time Slot (optional)</h5>
      <div className="overflow-y-auto max-h-[calc(50dvh)] no-scrollbar scrollBox">
        <Alert className="my-5">
          <Info className="h-4 w-4" />
          <AlertTitle>
            Time slots refresh every 5 minutes to show the most up-to-date availability.
          </AlertTitle>
          <AlertDescription>
            Once you have selected a time slot, you have 5 minutes to complete the booking process. If you do not complete the booking within 5 minutes, the time slot will be released and made available to other patients.
          </AlertDescription>
        </Alert>
        {
          (!bookAppointment.hpUserId || !bookAppointment.hpEmail) &&
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
            preferredDate={bookAppointment.preferredDate}
            onSelect={(date) => {
              setBookAppointmentForm((prev) => ({...prev, preferredDate: date, selectedTimeSlot: undefined}))
            }}
          />
          <VacantTimeSlot
            timeSlots={availableTimeSlots}
            selectedTimeSlot={bookAppointment.selectedTimeSlot}
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
