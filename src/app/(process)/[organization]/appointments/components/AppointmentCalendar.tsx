"use client";

import { useState } from "react";
import { Calendar } from "@components/ui/calendar"
import { Badge } from "@components/ui/badge"

export default function AppointmentCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  
  return (
    <div className="flex flex-row gap-5 items-baseline  w-full">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded border ring-black p-1 w-fit"
        disabled={{
          dayOfWeek: [0, 6], // Sunday and Saturday         
        }}
        
        modifiers={{
          holiday: [new Date('2024-05-01')],
          fullyBook: [new Date('2024-05-10'), new Date('2024-05-11'), new Date('2024-05-12')],
          close: {
            from: new Date('2024-05-02'),
            to: new Date('2024-05-06'),
            dayOfWeek: [3], // Saturday

          },
        }}
        classNames={{
          cell: "p-1",

        }}
        modifiersClassNames={{
          weekdays: "bg-red-500",
          fullyBook: "bg-red-300",
          close: "bg-muted text-muted-foreground",
          holiday: "bg-slate-300 text-white",
          selected: "bg-green-300 text-white",
          today: "bg-blue-300 ring-2",
        }}
        footer={<span className="font-medium text-sm">Select a date to show available time slots</span>}
      />
        
      <div className="space-y-2">
        <h3 className="text-md font-semibold mb-2">Legend:</h3>
        <div className="flex flex-row items-center justify-start gap-1 flex-wrap mt-2">
          <Badge variant="outline" className="bg-white text-black ring-1 ring-black">Available</Badge>
          {/* <Badge className="bg-red-300">Fully Booked</Badge> */}
          <Badge variant="outline" className="bg-muted text-muted-foreground">Close</Badge>
          <Badge variant="outline" className="bg-slate-300 text-white">Holiday</Badge>
          <Badge variant="outline" className="bg-blue-300 text-white">Today</Badge>
        </div>
        
      </div>
      
    </div>
      
  )
}
