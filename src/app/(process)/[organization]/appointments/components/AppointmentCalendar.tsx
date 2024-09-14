"use client";

import { Calendar } from "@components/ui/calendar"
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import { useMemo } from "react";

export default function AppointmentCalendar() {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom)

  const handleSelectDate = (date: Date | undefined) => {
    if(!date) return
    setBookAppointmentForm(prev => ({...prev, preferredDate: date, selectedTimeSlot: undefined}))
  }
  const availableDates = useMemo(() => bookAppointmentForm.availabilities?.filter(a => a.status).map(a => dayjs(a.date).startOf("day").toDate()), [bookAppointmentForm.availabilities]) ?? []
  console.log(bookAppointmentForm.availabilities);
  
  return (
    <div className="">
      <Calendar
        mode="single"
        selected={bookAppointmentForm.preferredDate}
        onSelect={handleSelectDate}
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
        footer={!bookAppointmentForm.preferredDate && <span className="font-medium text-sm">Select a date to show available time slots</span>}
      />
    </div>
      
  )
}
