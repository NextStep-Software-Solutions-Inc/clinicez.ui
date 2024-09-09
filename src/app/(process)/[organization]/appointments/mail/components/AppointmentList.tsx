"use client";

import { forwardRef, useMemo, useState } from "react"
import {formatDistanceToNow} from "date-fns"

import { cn, getBadgeVariantFromLabel } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import { ScrollArea } from "@components/ui/scroll-area"
import { useSearchParams } from "next/navigation"
import Each from "@components/utils/Each"
import { GetAppointments } from "@actions/appointments/appointments.action"
import { Separator } from "@components/ui/separator"
import { useOrgAppointments } from "@hooks/useAppointment";
import { Input } from "@components/ui/input";
import { ArrowRight, Search } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AppointmentStatus, RoutedAptStatus } from "@public/json/appointment-list";
interface AppointmentListProps {
  appointments: GetAppointments["data"]
}

export const AppointmentList = forwardRef<any, AppointmentListProps>(({appointments},ref) => {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("_appointment")
  const appointmentStatus = searchParams.get("_aptStatus")
  
  const setAppointment = (thisAptId: string) => {
    if(appointmentId === thisAptId) return
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("_appointment", thisAptId)
    window.history.pushState({}, "", `?${searchParams.toString()}`)
  }
  
  return (
    <ScrollArea ref={ref} className="flex-auto h-[100dvh]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        <Each
          of={appointments ?? []}
          render={(item) => (
            <button
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                appointmentId === item.id.toString() && "bg-muted"
              )}
              onClick={() => setAppointment(item.id.toString())}
            >
              <div className="flex items-center gap-2 w-full">
                {/* <Avatar>
                  <AvatarImage src={item.patient.picture ?? ""} alt={item.patient.nickname ?? ""}/>
                  <AvatarFallback>
                    {item.patient.firstName?.charAt(0) } {item.patient.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar> */}
                <div className="flex w-full flex-col gap-1 ">
                  <div className="flex items-center justify-between  flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Each
                        of={item.Requesters}
                        fallback={<span className="text-xs text-muted-foreground">No Requester defined</span>}
                        render={(requester, index) => {
                          return (
                            <div className="font-semibold items-center flex gap-2 ">
                              {requester.email === user?.email ? <span className="text-primary">You ({requester.email})</span> : requester.email}
                              {index < item.Requesters.length - 1 && <Separator orientation="vertical" className="h-4" />}
                            </div>
                          )
                        }}
                      />
                      {item.AppointmentAttribute?.status === "PENDING" && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                      )}
                      {!item._count.ConsultationRecords && (
                        <span className="flex h-2 w-2 rounded-full bg-red-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "ml-auto text-xs ",
                        appointmentId === item.id.toString()
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <div className="text-xs font-medium">{item.subject}
                    {/* (<span>{formatRelative(item.bookingDateTime, new Date())}</span>) */}
                  </div>
                </div>
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.complaint?.substring(0, 300)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getBadgeVariantFromLabel(item.AppointmentAttribute?.AppointmentType.name ?? "")}>
                  {item.AppointmentAttribute?.AppointmentType.name}
                </Badge>
                <Badge variant="outline">
                  {item.AppointmentAttribute?.AppointmentMode.name}
                </Badge>
                <Badge variant="secondary">
                  {item.AppointmentAttribute?.Service?.name}
                </Badge>
              </div>
              <div className="flex items-center justify-end gap-2 w-full">
                <span className="text-xs">
                  <ArrowRight className="inline-block w-3 h-3"/> {item.AppointmentAttribute?.preferredAppointee}
                </span>
                {appointmentStatus === "all" && <Badge variant="outline" className="capitalize">{item?.AppointmentAttribute?.status.toLocaleLowerCase()}</Badge>}

              </div>
            </button>
          )}
        />
      </div>
    </ScrollArea>
  )
})

AppointmentList.displayName = "AppointmentList"



interface AppointmentListWrapperProps {
  orgUid: string
}
export const AppointmentListWrapper = ({orgUid}:AppointmentListWrapperProps) => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams()
  const appointmentStatus = searchParams.get("_aptStatus")
  const routedAptStatus = searchParams.get("_routedAptStatus")
  const sort = searchParams.get("_sort") as "request" | "schedule"
  
  const {data : appointments} = useOrgAppointments({
    orgUid, 
    status: appointmentStatus?.toUpperCase() as AppointmentStatus, 
    routedAptStatus: routedAptStatus?.toUpperCase() as RoutedAptStatus,
    sort
  })

  const filteredAppointments = useMemo(() => {
    const withFallbackAppointments = appointments?.data ?? [];
    if (!query) return withFallbackAppointments;
    return withFallbackAppointments.filter((appointment) => {
      return (
        appointment.Requesters.some(requester => requester.email.toLowerCase().includes(query.toLowerCase())) ||
        appointment.subject.toLowerCase().includes(query.toLowerCase()) ||
        appointment.complaint?.toLowerCase().includes(query.toLowerCase())
      );
    });
  },[appointments,query])

  const updateQuery = (q: string) => {
    setQuery(q);
  }
  
  return (
    <>
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" type="search" value={query} onChange={e => updateQuery(e.target.value)} />
          </div>
        </form>
      </div>
      <AppointmentList appointments={filteredAppointments} />
    </>
  )
}