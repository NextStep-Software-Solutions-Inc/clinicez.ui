"use client";

import { Calendar } from "@components/ui/calendar"
import dayjs from "@lib/day-utils";


import { SelectSingleEventHandler } from "react-day-picker";

interface AppointmentCalendarProps {
  preferredDate?: Date
  availableDates: Date[]
  onSelect?: SelectSingleEventHandler
}

export default function AppointmentCalendar({ availableDates = [], preferredDate, onSelect }: AppointmentCalendarProps) {
  return (
    <div className="">
      <Calendar
        mode="single"
        selected={preferredDate}
        onSelect={onSelect}
        className="rounded-md border"
        disabled={[
          (d) => {
            return dayjs(d).isBefore(dayjs().startOf("day")) || !availableDates.some(a => dayjs(a).isSame(d, "day"))
          }
        ]}
        modifiers={{
          available: availableDates,
        }}
        classNames={{
        }}
        modifiersClassNames={{
          available: "bg-green-500 text-white hover:bg-teal-500",
          selected: "bg-primary text-white hover:bg-red-500 hover:text-white",
        }}
        footer={!preferredDate && <span className="font-medium text-sm">Select a date to show available time slots</span>}
      />
    </div>
      
  )
}
