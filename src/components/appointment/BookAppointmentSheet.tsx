"use client";

import { Button } from "@components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet"
import BookAppointmentSteps from "./BookAppointmentSteps";
import SelectTimeSlot from "./SelectTimeSlot";
import ChiefComplaint from "./ChiefComplaint";
import ConsentForm from "./ConsentForm";
import ReviewBooking from "./ReviewBooking";
import { InsertAttachment } from "./InsertAttachment";
import SelectService from "./SelectService";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

/**
 * @deprecated Legacy V1 booking drawer. Use BookAppointmentWizard in @/components/patient-dashboard-v2 instead.
 */
export default function BookAppointmentSheet() {
  
  const searchParams = useSearchParams();
  const open = useMemo(() => searchParams.has("book-appointment"), [searchParams]);

  const handleClose = (state: boolean) => {
    if(!state) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete("book-appointment");
      window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
    }
  }

  
  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="top" >
        <SheetHeader>
          <SheetTitle>Book an Appointment</SheetTitle>
          <SheetDescription>
            Filter the calendar to find the best time for your appointment.
          </SheetDescription>
        </SheetHeader>
        <div className="">
          <BookAppointmentSteps initialStep={1}>
            <SelectService/>
            <ChiefComplaint/>
            <InsertAttachment/>
            <ConsentForm/>
            <SelectTimeSlot/>
            <ReviewBooking/>
          </BookAppointmentSteps>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


