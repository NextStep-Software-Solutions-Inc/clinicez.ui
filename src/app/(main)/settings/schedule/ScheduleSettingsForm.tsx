"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"

import {toast} from "sonner"
import ActionButton from "@components/ActionButton"
import { useUser } from "@auth0/nextjs-auth0/client"
import Each from "@components/utils/Each"
import dayjs from "dayjs"
import { GetUserSchedules, upsertBaseUserScheduleAction } from "@actions/schedule/user-schedule.action"
import { useUserSchedules } from "@hooks/useUserSchedule"
import { formatDateTime } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Separator } from "@components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet"
import ScheduleForm, { scheduleFormSchema, ScheduleFormType } from "./ScheduleForm"

const daysOfWeek = [
  {
    id: 0,
    label: "Sunday"
  }, {
    id: 1,
    label: "Monday"
  }, {
    id: 2,
    label: "Tuesday"
  }, {
    id: 3,
    label: "Wednesday"
  }, {
    id: 4,
    label: "Thursday"
  }, {
    id: 5,
    label: "Friday"
  }, {
    id: 6,
    label: "Saturday"
  }
]

export default function ScheduleSettingsForm() {
  const user = useUser()
  const userId = user?.user?.sub
  const { data: userSchedules } = useUserSchedules(userId ?? "")
  const baseSchedule = userSchedules?.find(schedule => schedule.type === "base") 
  const exceptionSchedules = userSchedules?.filter(schedule => schedule.type === "exception")
  
  const form = useForm<ScheduleFormType>({
    resolver: zodResolver(scheduleFormSchema),
    mode: "onChange",
    values: {
      dateRange: {
        from: baseSchedule?.startDate,
        to: baseSchedule?.endDate,
      },
      isRecurring: baseSchedule?.isRecurring || false,
      startTime: (baseSchedule?.startDate && baseSchedule.startTime) ? formatDateTime(new Date(baseSchedule?.startDate), new Date(baseSchedule?.startTime)).format("HH:mm") : "",
      endTime: (baseSchedule?.endDate && baseSchedule.endTime) ? formatDateTime(new Date(baseSchedule?.endDate), new Date(baseSchedule?.endTime)).format("HH:mm") : "",
      daysOfWeek: baseSchedule?.daysOfWeek || [],
      weekOfMonth: baseSchedule?.weekOfMonth || [], 
      pattern: baseSchedule?.pattern || "daily",
    }
  })
  

  const action = async () => {
    form.handleSubmit(async (values) => {
      if (!userId) return toast.error("User not found");
      if(!values.dateRange.from || !values.dateRange.to) return toast.error("Date range is required")
      const startTime = dayjs(`${dayjs(values.dateRange.from).format("YYYY-MM-DD")}T${values.startTime}`).toDate()
      const endTime = dayjs(`${dayjs(values.dateRange.to).format("YYYY-MM-DD")}T${values.endTime}`).toDate()
      
      toast.promise(upsertBaseUserScheduleAction({
        id: baseSchedule?.id || 0,
        userId,
        type: "base",
        startDate: dayjs(values.dateRange.from).endOf("day").toDate(),
        endDate: dayjs(values.dateRange.to).endOf("day").toDate(),
        startTime,
        endTime,
        isRecurring: values.isRecurring,
        pattern: values.pattern,
        daysOfWeek: values.daysOfWeek,
        weekOfMonth: values.weekOfMonth
      }), {
        loading: "Saving...",
        success: (res) => {
          return res.message
        },
        error: (error) => `Something went wrong. Error: ${error}`
      })
    })()
  }

  return (
    <div>
      <div className="prose">
        <h2>Base Schedule</h2>
      </div>
      <Form {...form}>
        <form action={action} className="space-y-5 mb-5">
          <ScheduleForm form={form} schedule={baseSchedule}/>
          <ActionButton className="flex  ml-auto" disabled={form.formState.isLoading} type="submit">Set Base Schedule</ActionButton>
        </form>
      </Form>

      <Separator/>
      <div className="prose max-w-full">
        <div className="flex items-center justify-between">
          <h2>Exception Schedule</h2>
          <Button variant="outline">Add Exception</Button>
        </div>
      </div>

      <div className="space-y-3">
        <Each
          of={exceptionSchedules ?? []}
          render={(schedule) => {
            return (
              <ExceptionScheduleItem key={schedule.id} schedule={schedule}/>
            )
          }}
        />
      </div>
    </div>
  )
}

interface ExceptionScheduleItemProps {
  schedule: GetUserSchedules[number]
}
export const ExceptionScheduleItem = ({schedule}: ExceptionScheduleItemProps) => {
  const user = useUser()
  const userId = user?.user?.sub
  const form = useForm<ScheduleFormType>({
    resolver: zodResolver(scheduleFormSchema),
    mode: "onChange",
    values: {
      dateRange: {
        from: schedule?.startDate,
        to: schedule?.endDate,
      },
      isRecurring: schedule?.isRecurring || false,
      startTime: (schedule?.startDate && schedule.startTime) ? formatDateTime(new Date(schedule?.startDate), new Date(schedule?.startTime)).format("HH:mm") : "",
      endTime: (schedule?.endDate && schedule.endTime) ? formatDateTime(new Date(schedule?.endDate), new Date(schedule?.endTime)).format("HH:mm") : "",
      daysOfWeek: schedule?.daysOfWeek || [],
      weekOfMonth: schedule?.weekOfMonth || [], 
      pattern: schedule?.pattern || "daily",
    }
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      if (!userId) return toast.error("User not found");
      if(!values.dateRange.from || !values.dateRange.to) return toast.error("Date range is required")
      const startTime = dayjs(`${dayjs(values.dateRange.from).format("YYYY-MM-DD")}T${values.startTime}`).toDate()
      const endTime = dayjs(`${dayjs(values.dateRange.to).format("YYYY-MM-DD")}T${values.endTime}`).toDate()
      
      toast.promise(upsertBaseUserScheduleAction({
        id: schedule?.id || 0,
        userId,
        type: "exception",
        startDate: dayjs(values.dateRange.from).endOf("day").toDate(),
        endDate: dayjs(values.dateRange.to).endOf("day").toDate(),
        startTime,
        endTime,
        isRecurring: values.isRecurring,
        pattern: values.pattern,
        daysOfWeek: values.daysOfWeek,
        weekOfMonth: values.weekOfMonth
      }), {
        loading: "Saving...",
        success: (res) => {
          return res.message
        },
        error: (error) => `Something went wrong. Error: ${error}`
      })
    })()
  }
  return(
    <Sheet>
      <SheetTrigger asChild>
        <div className="bg-slate-50 p-3 rounded cursor-pointer hover:bg-slate-100">
          <div>
            <div className="text-sm font-medium">
              {formatDateTime(schedule.startDate, schedule.startTime).format("llll")} - {formatDateTime(schedule.endDate, schedule.endTime).format("llll")}
            </div>
            <div className="text-xs space-x-2">
              <span>{schedule.isRecurring ? "Recurring" : "One Time"}</span> 
              {schedule.isRecurring && (
                <>
                  <Badge>{schedule.pattern}</Badge>
                  <Badge variant="outline">{schedule.daysOfWeek.map(day => daysOfWeek.find(d => d.id === day)?.label).join(", ")}</Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="min-h-[calc(100dvh-30%)]">
        <div className="container">
          <SheetHeader>
            <SheetTitle>Exception Schedule</SheetTitle>
            <SheetDescription>
            Exception Schedule are meant to override the base schedule for a specific date range. Exception schedules can be one-time or recurring.
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form action={action} className="my-10 space-y-5">
              <ScheduleForm schedule={schedule} form={form}/>
              <ActionButton className="flex  ml-auto" disabled={form.formState.isLoading} type="submit">Set Schedule</ActionButton>
            </form>
          </Form>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" type="button">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}