"use client";

import { Calendar } from "@components/ui/calendar"
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import dayjs from "dayjs";

export default function AppointmentCalendar() {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom)

  const handleSelectDate = (date: Date | undefined) => {
    if(!date) return
    setBookAppointmentForm(prev => ({...prev, preferredDate: date, selectedTimeSlot: undefined}))
  }
  
  return (
    <div className="">
      <Calendar
        mode="single"
        selected={bookAppointmentForm.preferredDate}
        onSelect={handleSelectDate}
        className="rounded-md border"
        disabled={bookAppointmentForm.availabilities?.filter(a => a.status === "UNAVAILABLE").map(a => dayjs(a.date).toDate()) ?? [
          {
            after: new Date(),
            before: new Date(),
          },
          new Date(),
        ]}
        
        modifiers={{
          available: bookAppointmentForm.availabilities?.filter(a => a.status === "AVAILABLE").map(a => new Date(a.date)) ?? [],
        }}
        classNames={{
        }}
        modifiersClassNames={{
          available: "bg-primary text-primary-foreground hover:bg-teal-500",
          selected: "bg-red-400 text-white hover:bg-red-500 hover:text-white",
        }}
        footer={!bookAppointmentForm.preferredDate && <span className="font-medium text-sm">Select a date to show available time slots</span>}
      />
    </div>
      
  )
}
