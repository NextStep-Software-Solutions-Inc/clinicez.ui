import { ComponentProps, forwardRef } from "react"
import {formatDistanceToNow} from "date-fns"

import { cn } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import { ScrollArea } from "@components/ui/scroll-area"
import { useRouter, useSearchParams } from "next/navigation"
import Each from "@components/utils/Each"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import { GetAppointments } from "@actions/appointments/appointments.action"
import { Separator } from "@components/ui/separator"

interface AppointmentListProps {
  items: GetAppointments
}

export const AppointmentList = forwardRef<any, AppointmentListProps>(({ items }, ref) => {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("_appointment")
  const appointmentStatus = searchParams.get("_type")
  
  const router = useRouter()
  
  const setAppointment = (appointmentId: string) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("_appointment", appointmentId)
    router.replace(`?${searchParams.toString()}`)
  }

  return (
    <ScrollArea ref={ref} className="flex-auto h-[100dvh]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        <Each
          of={items}
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
                              {requester.email}
                              {index < item.Requesters.length - 1 && <Separator orientation="vertical" className="h-4" />}
                            </div>
                          )
                        }}
                      />
                      {item.AppointmentAttribute?.status === "PENDING" && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                      )}
                      {appointmentStatus === "all" && <Badge variant="default" className="capitalize">{item?.AppointmentAttribute?.status}</Badge>}
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
              </div>
            </button>
          )}
        />
      </div>
    </ScrollArea>
  )
})

AppointmentList.displayName = "AppointmentList"

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["initial"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["emergency"].includes(label.toLowerCase())) {
    return "destructive"
  }

  if (["follow-up"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
