"use client";

import { rescheduleAppointmentAction } from "@actions/appointments/appointments.action";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { Clock } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { toast } from "sonner";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useForm } from "react-hook-form";
import Each from "@components/utils/Each";
import { useHPs } from "@hooks/useHP";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTimeSlots } from "@hooks/useTimeSlots";
import { BarLoader } from "react-spinners";
import dayjs from "dayjs";

type ScheduleAppointment = z.infer<typeof scheduleAppointmentSchema>;
const scheduleAppointmentSchema = z.object({
  userId: z.string(),
  date: z.date(),
  startDateTime: z.date(),
  endDateTime: z.date(),
});

interface RescheduleAppointmentProps {
  disabled?: boolean;
  preferredDate?: Date;
  preferredUserId?: string | null;
  serviceId: number;
  appointmentTypeId: number;
}

export default function RescheduleAppointment({disabled = false, preferredDate, preferredUserId, serviceId, appointmentTypeId }: RescheduleAppointmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const {data: hps} = useHPs()

  const form = useForm<ScheduleAppointment>({
    resolver: zodResolver(scheduleAppointmentSchema),
    defaultValues: {
      userId: preferredUserId ?? "",
      date: preferredDate,
      startDateTime: undefined,
      endDateTime: undefined
    }
  })

  const userId = form.watch("userId")
  const {data: timeSlots, isValidating} = useTimeSlots({
    userId: userId,
    serviceId,
    appointmentTypeId
  })

  const action = async (formData: FormData) => {
    const res = await rescheduleAppointmentAction(formData)
    if(res) {
      toast.success("Appointment rescheduled successfully.")
      triggerRef.current?.click()
    }
  }
  
  const selectedDate = form.watch("date")
  const startDateTime = form.watch("startDateTime")
  const endDateTime = form.watch("endDateTime")
  const availableDates = useMemo(() => isValidating ? [] : timeSlots?.data?.filter(a => a.status).map(a => dayjs(a.date).startOf("day").toDate()), [isValidating, timeSlots?.data]) ?? []
  const availableTimeSlots = useMemo(() => isValidating ? [] : timeSlots?.data?.find(a => dayjs(a.date).isSame(selectedDate, "day"))?.timeSlots, [isValidating, timeSlots?.data, selectedDate]) ?? []

  useEffect(() => {
    if(!isValidating) return
    form.resetField("endDateTime");
    form.resetField("startDateTime");
    
  }, [form, isValidating, preferredDate, preferredUserId])
  
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
        <PopoverContent className="flex w-fit p-0">
          <div className="p-4">
            <h5 className="text-lg font-bold">Schedule Appointment</h5>
            <Form {...form}>
              <form action="">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Healthcare Provider</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a healthcare provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <Each
                            of={hps ?? []}
                            render={(hp) => {
                              const hpType = hp.type
                              return (
                                <SelectItem value={hp.User.email}>{hp.HPProfile?.title} {hp.HPProfile?.name} {hp.HPProfile?.suffix}</SelectItem>
                              )
                            }}
                          />
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a hp to show their vacant slots
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isValidating && <BarLoader className="min-w-full my-2" color="teal"/>}
                <div className="flex lg:flex-row flex-col items-center gap-5 justify-center my-5">
                  <AppointmentCalendar
                    availableDates={availableDates}
                    preferredDate={selectedDate}
                    onSelect={(date) => {
                      if(!date) return
                      form.setValue("date", date)
                    }}
                  />
                  <VacantTimeSlot
                    timeSlots={availableTimeSlots}
                    selectedTimeSlot={{
                      start: startDateTime,
                      end: endDateTime
                    }}
                    onSelect={(timeSlot) => {
                      form.setValue("startDateTime", timeSlot.start)
                      form.setValue("endDateTime", timeSlot.end)
                    }}
                  />
                </div>
              </form>
            </Form>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>Reschedule</TooltipContent>
    </Tooltip>
  );
}
