"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form } from "@components/ui/form"
import {toast} from "sonner"
import ActionButton from "@components/ActionButton"
import { useUser } from "@auth0/nextjs-auth0/client"
import Each from "@components/utils/Each"
import { deleteUserScheduleAction, GetUserSchedules, upsertBaseUserScheduleAction } from "@actions/schedule/user-schedule.action"
import { useUserSchedules } from "@hooks/useUserSchedule"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Separator } from "@components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet"
import ScheduleForm, { scheduleFormSchema, ScheduleFormType } from "./ScheduleForm"
import { useRef } from "react"
import { Trash } from "lucide-react"
import dayjs, { formatDateTime } from "@lib/day-utils";


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
  const { data: userSchedules, mutate } = useUserSchedules(userId ?? "")
  const baseSchedule = userSchedules?.find(schedule => schedule.type === "base") 
  const exceptionSchedules = userSchedules?.filter(schedule => schedule.type === "exception")
  
  const form = useForm<ScheduleFormType>({
    resolver: zodResolver(scheduleFormSchema),
    values: {
      dateRange: {
        from: baseSchedule?.startDate,
        to: baseSchedule?.endDate,
      },
      isRecurring: baseSchedule?.isRecurring || false,
      // startTime: (baseSchedule?.startDate && baseSchedule.startTime) ? formatDateTime(new Date(baseSchedule?.startDate), new Date(baseSchedule?.startTime)).format("HH:mm") : "",
      // endTime: (baseSchedule?.endDate && baseSchedule.endTime) ? formatDateTime(new Date(baseSchedule?.endDate), new Date(baseSchedule?.endTime)).format("HH:mm") : "",
      startTime: baseSchedule?.startTime ?? "",
      endTime: baseSchedule?.endTime  ?? "",
      daysOfWeek: baseSchedule?.daysOfWeek.length ? baseSchedule?.daysOfWeek :  [0,1,2,3,4,5,6],
      weekOfMonth: baseSchedule?.weekOfMonth.length ? baseSchedule?.weekOfMonth : [1,2,3,4,5], 
      pattern: baseSchedule?.pattern || "daily",
    }
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      if (!userId) return toast.error("User not found");
      if(!values.dateRange.from || !values.dateRange.to) return toast.error("Date range is required")
      // const startTime = dayjs(`${dayjs(values.dateRange.from).format("YYYY-MM-DD")}T${values.startTime}`).toISOString()
      // const endTime = dayjs(`${dayjs(values.dateRange.to).format("YYYY-MM-DD")}T${values.endTime}`).toISOString()
      
      toast.promise(upsertBaseUserScheduleAction({
        id: baseSchedule?.id || 0,
        userId,
        type: "base",
        startDate: dayjs(values.dateRange.from).endOf("day").toDate(),
        endDate: dayjs(values.dateRange.to).endOf("day").toDate(),
        startTime: values.startTime,
        endTime: values.endTime,
        isRecurring: values.isRecurring,
        pattern: values.pattern,
        daysOfWeek: values.daysOfWeek,
        weekOfMonth: values.weekOfMonth
      }), {
        loading: "Saving...",
        success: (res) => {
          if(res.status) {
            mutate()
          }
          return res.message
        },
        error: (error) => `Something went wrong. Error: ${error}`
      })
    })()
  }
  const handleDelete = (id: number) => {
    toast.promise(deleteUserScheduleAction(id), {
      loading: "Deleting...",
      success: (res) => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: (error) => `Something went wrong. Error: ${error}`
    })
  }

  return (
    <div>
      <div className="prose">
        <h2>Base Schedule</h2>
      </div>
      <Form {...form}>
        <form action={action} className="space-y-5 mb-5">
          <ScheduleForm form={form}/>
          <ActionButton className="flex  ml-auto" disabled={form.formState.isLoading} type="submit">Set Base Schedule</ActionButton>
        </form>
      </Form>

      <Separator/>
      <div className="prose max-w-full">
        <div className="flex items-center justify-between">
          <h2>Exception Schedule</h2>
          <ExceptionScheduleSheet>
            <Button variant="outline">Add Exception</Button>
          </ExceptionScheduleSheet>
        </div>
      </div>

      <div className="space-y-3">
        <Each
          of={exceptionSchedules ?? []}
          render={(schedule) => {
            return (
              <ExceptionScheduleSheet key={schedule.id} schedule={schedule}>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded cursor-pointer hover:bg-slate-100">
                  <div>
                    <div className="text-sm font-semibold">
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
                  <div className="flex gap-2 items-center" onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(schedule.id)
                  }}>
                    <Separator orientation="vertical" className="h-6"/>
                    <Button variant="ghost" size="icon">
                      <Trash className="w-4 h-4 text-red-500 hover:scale-125 transition-all"/>
                    </Button>
                  </div>
                </div>
              </ExceptionScheduleSheet>
            )
          }}
        />
      </div>
    </div>
  )
}

interface ExceptionScheduleItemProps {
  schedule?: GetUserSchedules[number],
  children?: React.ReactNode
}
export const ExceptionScheduleSheet = ({schedule, children}: ExceptionScheduleItemProps) => {
  const user = useUser()
  const userId = user?.user?.sub
  const { mutate } = useUserSchedules(userId ?? "")
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const form = useForm<ScheduleFormType>({
    resolver: zodResolver(scheduleFormSchema),
    values: {
      dateRange: {
        from: schedule?.startDate,
        to: schedule?.endDate,
      },
      isRecurring: schedule?.isRecurring || false,
      // startTime: (schedule?.startDate && schedule.startTime) ? formatDateTime(new Date(schedule?.startDate), schedule?.startTime)).format("HH:mm") : "",
      // endTime: (schedule?.startDate && schedule.startTime) ? formatDateTime(new Date(schedule?.startDate), new Date(schedule?.startTime)).format("HH:mm") : "",
      startTime: schedule?.startTime ?? "",
      endTime: schedule?.endTime  ?? "",
      daysOfWeek: schedule?.daysOfWeek.length ? schedule?.daysOfWeek :  [0,1,2,3,4,5,6],
      weekOfMonth: schedule?.weekOfMonth.length ? schedule?.weekOfMonth : [1,2,3,4,5], 
      pattern: schedule?.pattern || "daily",
    }
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      if (!userId) return toast.error("User not found");
      if(!values.dateRange.from || !values.dateRange.to) return toast.error("Date range is required")
      // const startTime = dayjs(`${dayjs(values.dateRange.from).format("YYYY-MM-DD")}T${values.startTime}`).toISOString()
      // const endTime = dayjs(`${dayjs(values.dateRange.to).format("YYYY-MM-DD")}T${values.endTime}`).toISOString()
      
      toast.promise(upsertBaseUserScheduleAction({
        id: schedule?.id || 0,
        userId,
        type: "exception",
        startDate: dayjs(values.dateRange.from).endOf("day").toDate(),
        endDate: dayjs(values.dateRange.to).endOf("day").toDate(),
        startTime: values.startTime,
        endTime: values.endTime,
        isRecurring: values.isRecurring,
        pattern: values.pattern,
        daysOfWeek: values.daysOfWeek,
        weekOfMonth: values.weekOfMonth
      }), {
        loading: "Saving...",
        success: (res) => {
          if(res.status) {
            mutate()
            closeBtnRef.current?.click()
          }
          return res.message
        },
        error: (error) => `Something went wrong. Error: ${error}`
      })
    })()
  }
  return(
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="bottom" className="min-h-[calc(100dvh-70%)]">
        <Form {...form}>
          <form action={action} className="container">
            <SheetHeader>
              <SheetTitle>Exception Schedule</SheetTitle>
              <SheetDescription>
              Exception Schedule are meant to override the base schedule for a specific date range. Exception schedules can be one-time or recurring.
              </SheetDescription>
            </SheetHeader>
            <ScheduleForm form={form}/>
            <SheetFooter className="gap-2">
              <SheetClose asChild>
                <Button ref={closeBtnRef} variant="outline" type="button">Close</Button>
              </SheetClose>
              <ActionButton className="flex ml-auto w-full sm:w-fit" disabled={form.formState.isLoading} type="submit">Set Schedule</ActionButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}