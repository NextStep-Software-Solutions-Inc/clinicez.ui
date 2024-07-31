"use client";

import { Badge } from "@components/ui/badge";
import { toast } from "@components/ui/use-toast";
import Each from "@components/utils/Each";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { useState } from "react";
import { BookAppointmentForm } from "./FilterForm";

const timeSlots = [
  {id:1, slot: "10:00 AM - 11:00 AM"},
  {id:2, slot: "11:00 AM - 12:00 PM"},
  {id:3, slot: "12:00 PM - 1:00 PM"},
  {id:4, slot: "3:00 PM - 4:00 PM"},
  {id:5, slot: "4:00 PM - 5:00 PM"}
]
export default function VacantTimeSlot() {
  const [bookAppointmentForm, setBookAppointmentForm] = useLocalStorage<BookAppointmentForm>("book-appointment-form", {
    orgUid: "ustp-hims",
  });
  const handleSelectTimeSlot = (timeSlotId: number) => {
    setBookAppointmentForm({});
    toast({
      title: "Time Slot Selected",
      description: `You have selected: ${timeSlots.find((timeSlot) => timeSlot.id === timeSlotId)?.slot}`,
    });''
  }
  return (
    <div>
      <h3 className="text-md font-semibold mb-2">Vacant Time Slots:</h3>
      <div className="flex flex-row items-center justify-start gap-1 flex-wrap mt-2">
        <Each
          of={timeSlots}
          render={(timeSlot) => (
            <Badge className="cursor-pointer" onClick={() => handleSelectTimeSlot(timeSlot.id)} variant={bookAppointmentForm.timeSlotId === timeSlot.id ? "default": "secondary"}>{timeSlot.slot}</Badge>
          )}
        />
      </div>
    </div>
  );
}
