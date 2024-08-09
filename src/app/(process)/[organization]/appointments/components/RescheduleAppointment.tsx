"use client";

import { rescheduleAppointmentAction } from "@actions/appointments/appointments.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { addDays, addHours, nextSaturday, format, getTime, getHours, getMinutes } from "date-fns";
import { Clock } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export default function RescheduleAppointment({disabled = false, bookingDateTime = new Date()}: {disabled?: boolean, bookingDateTime: Date}) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [selectedDateTime, setSelectedDateTime] = React.useState(bookingDateTime)

  const onChangeDate = (date: Date) => {
    setSelectedDateTime(date)
  }
  
  const changeCalendarDate = (date:Date) => {
    // preserve time 
    const newDate = new Date(date)
    const timestamp = getTime(selectedDateTime ?? bookingDateTime)
    newDate.setHours(getHours(timestamp))
    newDate.setMinutes(getMinutes(timestamp))
    onChangeDate(newDate)
  }
  const changeTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const newDate = new Date(selectedDateTime?.toISOString() ?? bookingDateTime.toString())
    newDate.setHours(parseInt(hours))
    newDate.setMinutes(parseInt(minutes))
    onChangeDate(newDate)
  }
  
  const formattedTime = format(selectedDateTime ?? bookingDateTime, "HH:mm")

  const action = async (formData: FormData) => {
    const res = await rescheduleAppointmentAction(formData)
    if(res) {
      toast.success("Appointment rescheduled successfully.")
      triggerRef.current?.click()
    }
  }

  return (
    <Tooltip>
      <Popover>
        <PopoverTrigger ref={triggerRef} asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <Clock className="h-4 w-4" />
              <span className="sr-only">Reschedule</span>
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent    className="flex w-full p-0">
          <form action={action} className="flex flex-col gap-2 border-r px-2 py-4">
            <div className="px-4 text-sm font-medium">Reschedule to:  <span className="bg-slate-200 p-2 rounded-sm">{format(selectedDateTime?.toString()!, "PPp")}</span></div>
            <div className="grid min-w-[250px] gap-1">
              <Button
                type="button"
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => onChangeDate(addHours(bookingDateTime, 4))}
              >
                In 4 hours
                <span className="ml-auto text-muted-foreground">
                  {format(addHours(bookingDateTime, 4), "E, h:m b")}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => onChangeDate(addDays(bookingDateTime, 1))}
              >
                The next day
                <span className="ml-auto text-muted-foreground">
                  {format(addDays(bookingDateTime, 1), "E, h:m b")}
                </span>
              </Button>
              <Button             
                type="button"
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => onChangeDate(nextSaturday(bookingDateTime))}
              >
                Next Saturday
                <span className="ml-auto text-muted-foreground">
                  {format(nextSaturday(bookingDateTime), "E, h:m b")}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"  
                className="justify-start font-normal"
                onClick={() => onChangeDate(addDays(bookingDateTime, 7))}
              >
                In a week
                <span className="ml-auto text-muted-foreground">
                  {format(addDays(bookingDateTime, 7), "E, h:m b")}
                </span>
              </Button>
            </div>
            <ActionButton type="submit" className="mt-auto" name="bookingDate" value={format(selectedDateTime ?? bookingDateTime, "Pp")}>Reschedule</ActionButton>
          </form>
          <div className="p-4">
            <Calendar selected={selectedDateTime ?? bookingDateTime} onDayClick={changeCalendarDate} />
            <input 
              id="time"
              className="bg-slate-200 p-2 rounded-sm ring-2 w-full"
              type="time" 
              value={formattedTime}
              onChange={(e) => changeTime(e.target.value)} 
            />
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>Reschedule</TooltipContent>
    </Tooltip>
  );
}
