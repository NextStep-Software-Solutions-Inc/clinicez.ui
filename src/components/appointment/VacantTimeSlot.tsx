"use client";

import { Badge } from "@components/ui/badge";
import Each from "@components/utils/Each";
import { toast } from "sonner";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { GetUserTimeSlots } from "@actions/schedule/time-slot.actions";
dayjs.extend(utc)

interface VacantTimeSlotProps {
  timeSlots: GetUserTimeSlots["data"][number]["timeSlots"]
  selectedTimeSlot?: {
    start: Date
    end: Date
  },
  onSelect?: (timeSlot: {start: Date, end: Date}) => void
}

export default function VacantTimeSlot({timeSlots = [], selectedTimeSlot, onSelect}:VacantTimeSlotProps) {
  const handleSelectTimeSlot = (timeSlot: {
    start: Date;
    end: Date;
  }) => {
    onSelect?.(timeSlot)
    toast.message(`You have selected: ${timeSlotToString(timeSlot)}`);
  }
  return (
    <div className="w-[25rem]">
      <h3 className="text-md font-semibold mb-2">Vacant Time Slots:</h3>
      <div className="flex flex-row items-center justify-start gap-1 flex-wrap mt-2">
        <Each
          of={timeSlots ?? []}
          fallback={<div className="text-sm text-gray-400">No vacant time slots available. Pick a date from the calendar first.</div>}
          render={(timeSlot) =>{
            return  (
              <Badge className="cursor-pointer grow" onClick={() => handleSelectTimeSlot(timeSlot)} variant={(selectedTimeSlot && isSameTimeSlot(selectedTimeSlot, timeSlot)) ? "default": "secondary"}>{timeSlotToString(timeSlot)}</Badge>
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
  return `${dayjs(timeSlot.start).format("hh:mm A")}- ${dayjs(timeSlot.end).format("hh:mm A")}`;
}

const isSameTimeSlot = (timeSlot1: TimeSlot, timeSlot2: TimeSlot) => {
  return timeSlot1.start === timeSlot2.start && timeSlot1.end === timeSlot2.end
}