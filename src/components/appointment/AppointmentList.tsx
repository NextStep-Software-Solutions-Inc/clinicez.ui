"use client";

import { forwardRef } from "react"
import { useUser } from "@clerk/nextjs"
import { cn, getBadgeVariantFromLabel } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import { ScrollArea } from "@components/ui/scroll-area"
import { useSearchParams } from "next/navigation"
import Each from "@components/utils/Each"
import { GetAppointments } from "@actions/appointments/appointments.action"
import { Separator } from "@components/ui/separator"
import { ArrowRight } from "lucide-react";
import dayjs from "@/lib/day-utils"
import { combineDateTime } from "@/lib/day-utils";
import { getHealthcareProviderName } from "@/lib/hp-utils";
import { getDepartmentName } from "@/lib/formatter-utils";

interface AppointmentListProps {
  appointments: GetAppointments["data"]
}

export const AppointmentList = forwardRef<HTMLDivElement, AppointmentListProps>(({ appointments }, ref) => {
  const { user: authUser } = useUser()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("_appointment")
  const appointmentStatus = searchParams.get("_aptStatus")?.toLocaleLowerCase()

  const formatFullName = (requesterUser?: {
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    userId?: string | null;
  }) => {
    if (!requesterUser) return "Unknown requester"
    const { firstName, middleName, lastName, suffix, userId } = requesterUser
    const nameParts = [firstName, middleName, lastName, suffix].filter(Boolean)
    if (nameParts.length === 0) return userId ?? "Unknown requester"
    return nameParts.join(" ")
  }

  const getCollegeName = (requesterUser?: {
    StudentRecords?: Array<{
      College?: {
        name?: string | null;
      } | null;
    }>;
    UserEmployments?: Array<{
      College?: {
        name?: string | null;
      } | null;
    }>;
  }) => {
    if (!requesterUser) return undefined
    const collegeFromStudentRecord = requesterUser.StudentRecords?.find((record) => record.College?.name)?.College?.name
    if (collegeFromStudentRecord) return collegeFromStudentRecord
    const collegeFromEmployment = requesterUser.UserEmployments?.find((employment) => employment.College?.name)?.College?.name
    return collegeFromEmployment ?? undefined
  }

  const setAppointment = (thisAptId: string) => {
    if (appointmentId === thisAptId) return
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("_appointment", thisAptId)
    window.history.pushState({}, "", `?${searchParams.toString()}`)
  }


  return (
    <ScrollArea ref={ref} className="flex-auto h-[100dvh]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        <Each
          of={appointments ?? []}
          fallback={<div className="text-muted-foreground text-center">No appointments found.</div>}
          render={(item) => {
            const getTransitionDate = () => {
              // base on appointment status get the date
              if (appointmentStatus === "all") return dayjs(item.createdAt)
              if (appointmentStatus === "pending") return dayjs(item.createdAt)
              if (appointmentStatus === "completed") return dayjs(item.AppointmentAttribute?.completedAt)
              if (appointmentStatus === "rejected") return dayjs(item.AppointmentAttribute?.rejectedAt)
              if (appointmentStatus === "received") return dayjs(item.AppointmentAttribute?.receivedAt)
              if (appointmentStatus === "rescheduled") return dayjs(item.AppointmentAttribute?.rescheduledAt)
              if (appointmentStatus === "routed") return dayjs(item.updatedAt)
              return dayjs(item.createdAt)
            }
            return (
              <button
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                  appointmentId === item.id.toString() && "bg-muted"
                )}
                onClick={() => setAppointment(item.id.toString())}
              >
                <div className="flex w-full flex-col gap-1">
                  {/* Name and Department first */}
                  <div className="flex flex-wrap items-start gap-2 text-xs">
                    <Each
                      of={item.Requesters}
                      fallback={<span className="text-muted-foreground">No Requester defined</span>}
                      render={(requester, index) => {
                        const requesterUser = requester.User
                        const fullName = formatFullName(requesterUser)
                        const departmentName = getDepartmentName(requesterUser)
                        const isCurrentUser = requesterUser?.userId === authUser?.id
                        return (
                          <div className="flex items-center gap-2">
                            <div className="leading-tight">
                              <span className={cn("block text-xs font-semibold", isCurrentUser ? "text-primary" : "text-foreground")}>
                                {isCurrentUser ? `You (${fullName})` : fullName}
                              </span>
                              {departmentName && (
                                <span className="text-[0.65rem] text-muted-foreground">{departmentName}</span>
                              )}
                            </div>
                            {index < item.Requesters.length - 1 && <Separator orientation="vertical" className="h-4" />}
                          </div>
                        )
                      }}
                    />
                  </div>
                  {/* Subject now below Name/Department */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold leading-snug line-clamp-2">{item.subject}</span>
                    <div
                      className={cn(
                        "ml-auto text-xs flex items-center gap-2 basis-36 justify-end",
                        appointmentId === item.id.toString()
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <Separator orientation="vertical" className="h-4" />
                      {getTransitionDate().fromNow()}
                    </div>
                  </div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {item.complaint?.substring(0, 300)}
                </div>
                {item.AppointmentTag && item.AppointmentTag.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[0.65rem] text-muted-foreground">Tagged:</span>
                    <Each
                      of={item.AppointmentTag.slice(0, 3)}
                      render={(tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[0.65rem] px-1 py-0 bg-gray-200">
                          {getHealthcareProviderName(tag.HealthcareProvider)}
                        </Badge>
                      )}
                    />
                    {item.AppointmentTag.length > 3 && (
                      <span className="text-[0.65rem] text-muted-foreground">
                        +{item.AppointmentTag.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 truncate">
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
                  {/* Assigned Doctor Section */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1">
                    {(() => {
                      const assignedHPs = item.AppointmentRouting?.filter(r => r.status === "ACCEPTED" || r.status === "PENDING") ?? [];
                      if (assignedHPs.length === 0) {
                        return <span className="italic">No assigned doctor</span>;
                      }
                      return (
                        <>
                          <span className="font-medium">Assigned to:</span>
                          <span className="text-primary">{assignedHPs.map((routing, idx) => {
                            const hp = routing.RoutedTo;
                            const hpName = hp.HPProfile?.name
                              ? `${hp.HPProfile.title || ""} ${hp.HPProfile.name} ${hp.HPProfile.suffix || ""}`.trim()
                              : `${hp.User.firstName || ""} ${hp.User.middleName || ""} ${hp.User.lastName || ""} ${hp.User.suffix || ""}`.trim();
                            return (
                              <span key={routing.id}>
                                {hpName}
                                {idx < assignedHPs.length - 1 && ", "}
                              </span>
                            );
                          })}</span>
                        </>
                      );
                    })()}
                  </div>
                  <span className="text-xs flex gap-1 items-center">
                    <ArrowRight className="inline-block w-3 h-3" />
                    {/* {item.AppointmentAttribute?.preferredAppointee} */}
                    {item.AppointmentAttribute?.date && item.AppointmentAttribute.timeStart && <span>{dayjs(combineDateTime(item.AppointmentAttribute.date, item.AppointmentAttribute.timeStart)).fromNow()}</span>}
                  </span>
                  {appointmentStatus === "all" && <Badge variant="outline" className="capitalize">{item?.AppointmentAttribute?.status.toLocaleLowerCase()}</Badge>}
                  <span className="flex gap-1">
                    {item.AppointmentAttribute?.status === "PENDING" && (
                      <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                    )}
                    {!item._count.ConsultationTickets && (
                      <span className="flex h-2 w-2 rounded-full bg-red-600" />
                    )}
                  </span>
                </div>
              </button>
            )
          }
          }
        />
      </div>
    </ScrollArea>
  )
})

AppointmentList.displayName = "AppointmentList"
