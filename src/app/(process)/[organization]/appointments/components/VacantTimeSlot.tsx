"use client";

import { Badge } from "@components/ui/badge";
import Each from "@components/utils/Each";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { toast } from "sonner";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc)
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Manila");

export default function VacantTimeSlot() {

  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  
  console.log({bookAppointmentForm});
  
  const handleSelectTimeSlot = (timeSlot: {
    start: Date;
    end: Date;
  }) => {
    setBookAppointmentForm((prev) => ({...prev, selectedTimeSlot: timeSlot}));
    toast.message(`You have selected: ${timeSlotToString(timeSlot)}`);
  }
  return (
    <div>
      <h3 className="text-md font-semibold mb-2">Vacant Time Slots:</h3>
      <div className="flex flex-row items-center justify-start gap-1 flex-wrap mt-2">
        <Each
          of={(bookAppointmentForm.availabilities ?? []).find(a => dayjs.tz(a.date).isSame(bookAppointmentForm.preferredDate))?.timeSlots ?? []}
          fallback={<div className="text-sm text-gray-400">No vacant time slots available. Pick a date from the calendar.</div>}
          render={(timeSlot) =>{
            return  (
              <Badge className="cursor-pointer" onClick={() => handleSelectTimeSlot(timeSlot)} variant={(bookAppointmentForm.selectedTimeSlot && isSameTimeSlot(bookAppointmentForm.selectedTimeSlot, timeSlot)) ? "default": "secondary"}>{timeSlotToString(timeSlot)}</Badge>
            )
          }}
        />
      </div>
    </div>
  );
}


type TimeSlot = {
  start: Date;
  end: Date;
}

const timeSlotToString = (timeSlot: TimeSlot) => {
  return `${dayjs.tz(timeSlot.start).format("hh:mm A")}- ${dayjs.tz(timeSlot.end).format("hh:mm A")}`;
}

const isSameTimeSlot = (timeSlot1: TimeSlot, timeSlot2: TimeSlot) => {
  return timeSlot1.start === timeSlot2.start && timeSlot1.end === timeSlot2.end
}