"use client";

import { Calendar, CalendarProps } from "@components/ui/calendar"
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

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
        classNames={{}}
        modifiersClassNames={{
          available: "bg-primary text-primary-foreground hover:bg-teal-500",
          selected: "bg-red-400 text-white hover:bg-red-500 hover:text-white",
        }}
        footer={!preferredDate && <span className="font-medium text-sm">Select a date to show available time slots</span>}
      />
    </div>
      
  )
}
