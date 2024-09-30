"use client";

import { GetAppointment, rescheduleAppointmentAction } from "@actions/appointments/appointments.action";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { Clock, Group } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { toast } from "sonner";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@components/ui/select";
import { useForm } from "react-hook-form";
import Each from "@components/utils/Each";
import { useHPs } from "@hooks/useHP";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTimeSlots } from "@hooks/useTimeSlots";
import { BarLoader } from "react-spinners";
import dayjs from "dayjs";
import { Checkbox } from "@components/ui/checkbox";
import ActionButton from "@components/ActionButton";

type ScheduleAppointment = z.infer<typeof scheduleAppointmentSchema>;
const scheduleAppointmentSchema = z.object({
  hpId: z.string(),
  date: z.date({
    required_error: "Please select a date"
  }),
  startDateTime: z.date({
    required_error: "Please select a start time",
  }),
  endDateTime: z.date({
    required_error: "Please select an end time"
  }),
  assign: z.boolean().default(true).optional()
});

interface RescheduleAppointmentProps {
  disabled?: boolean;
  appointment: NonNullable<GetAppointment["data"]>;
  onRescheduled?: () => void;
}

export default function RescheduleAppointment({disabled = true, onRescheduled, appointment}: RescheduleAppointmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const {data: hps} = useHPs()

  const filteredHps = useMemo(() => hps?.filter(hp => {
    const skip = appointment.AppointmentRouting.some(a => 
      a.routedToRole.toUpperCase() === hp.type && 
      (["PENDING", "ACCEPTED"].includes(a.status) || 
      (["CANCELLED", "DECLINED"].includes(a.status) && Number(a.routedTo) === hp.id))
    );
    return !skip || hp.id.toString() === appointment.AppointmentAttribute?.preferredAppointee

  }), [appointment.AppointmentAttribute?.preferredAppointee, appointment.AppointmentRouting, hps])
  const form = useForm<ScheduleAppointment>({
    resolver: zodResolver(scheduleAppointmentSchema),
    reValidateMode: "onChange",
    defaultValues: {
      hpId: appointment.AppointmentAttribute?.preferredAppointee ?? undefined,
      date: appointment.AppointmentAttribute?.date ? new Date(appointment.AppointmentAttribute.date) : undefined,
      assign: true
    }
  })
  
  const hpId = form.watch("hpId")
  const existingRoute = appointment.AppointmentRouting.some(r => r.routedTo === hpId)
  const selectedHp = useMemo(() => hps?.find(hp => hp.id.toString() === hpId), [hpId, hps])
  const {data: timeSlots, isValidating} = useTimeSlots({
    hpId,
    userId: selectedHp?.User.userId ?? "",
    serviceId: appointment.AppointmentAttribute?.Service?.id,
    appointmentTypeId: appointment.AppointmentAttribute?.AppointmentType.id
  })

  const action = async () => {
    if(isValidating) {
      toast.error("Please wait for the available time slots to load")
      return;
    }
    
    form.handleSubmit(async (data) => {
      if(!selectedHp) {
        toast.error("Please select a healthcare provider to reschedule the appointment")
        return
      }

      toast.promise(rescheduleAppointmentAction({
        appointmentId: appointment.id, 
        assign: existingRoute ? false : data.assign ?? false,
        hpId: selectedHp?.id.toString(),
        hpRole: selectedHp?.type,
        date: data.date.toISOString(),
        startDateTime: data.startDateTime.toISOString(),
        endDateTime: data.endDateTime.toISOString()
      }), {
        loading: "Rescheduling appointment...",
        success: (res) => {
          if(res.status) {
            triggerRef.current?.click()
            onRescheduled?.()
          }
          return res.message
        },
        error: "Failed to reschedule appointment"
      })
      
    },(errorFields) => {
      Object.entries(errorFields).forEach(([key, value]) => { 
        toast.error(value.message)
      })
    })()
  }
  
  const selectedDate = form.watch("date")
  const startDateTime = form.watch("startDateTime")
  const endDateTime = form.watch("endDateTime")
  const availableDates = useMemo(() => isValidating ? [] : timeSlots?.data?.filter(a => a.status).map(a => dayjs(a.date).startOf("day").toDate()), [isValidating, timeSlots?.data]) ?? []
  const availableTimeSlots = useMemo(() => isValidating 
    ?  [] 
    : timeSlots?.data?.find(a => dayjs(a.date).isSame(selectedDate, "day"))?.timeSlots.map(ts => {
      return {
        start: dayjs(ts.start).toDate(),
        end: dayjs(ts.end).toDate()
      }
    }), [isValidating, timeSlots?.data, selectedDate]) ?? []

  useEffect(() => {
    if(isValidating){
      const date = form.watch("date")
      form.reset({
        hpId: hpId,
        assign: true,
        date
      })
    }
    ;
  }, [form, isValidating, hpId])
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
            <h5 className="text-lg font-bold">Reschedule Appointment</h5>
            <Form {...form}>
              <form action={action}>
                <FormField
                  control={form.control}
                  name="hpId"
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
                          <SelectGroup>
                            <SelectLabel>North America</SelectLabel>
                            <Each
                              of={filteredHps ?? []}
                              render={(hp) => {
                                return (
                                  <SelectItem value={hp.id.toString()}>{hp.HPProfile?.title ?? hp.User.firstName ?? "-"} {hp.HPProfile?.name ?? hp.User.lastName ?? "-"} {hp.HPProfile?.suffix ?? hp.User.suffix ?? ""} (<span className="italic">{hp.type.toLocaleLowerCase()}</span>)</SelectItem>
                                )
                              }}
                            />
                          </SelectGroup>
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
                      form.reset({
                        hpId: hpId,
                        assign: existingRoute,
                        date: date
                      })
                    }}
                  />
                  <VacantTimeSlot
                    timeSlots={availableTimeSlots}
                    selectedTimeSlot={{
                      start: dayjs(startDateTime).toDate(),
                      end: dayjs(endDateTime).toDate()
                    }}
                    onSelect={(timeSlot) => {
                      form.setValue("startDateTime", timeSlot.start, {
                        shouldValidate: true
                      })
                      form.setValue("endDateTime", timeSlot.end, {
                        shouldValidate: true
                      })
                    }}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="assign"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={!existingRoute}
                            disabled
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Assign to healthcare provider immediately after scheduling
                        </label>
                      </div>
                      <FormDescription>
                        Assigned healthcare provider will be notified to accept the appointment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ActionButton 
                  disabled={form.formState.isSubmitting || !form.formState.isValid}
                  className="mt-5 w-full"
                >Book now</ActionButton>
              </form>
            </Form>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent >Reschedule</TooltipContent>
    </Tooltip>
  );
}
