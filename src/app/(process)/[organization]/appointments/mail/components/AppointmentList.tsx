import { ComponentProps } from "react"
import {formatDistanceToNow, formatDate, formatRelative} from "date-fns"

import { cn } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import { ScrollArea } from "@components/ui/scroll-area"
import { Mail } from "../data"
import { useRouter, useSearchParams } from "next/navigation"
import Each from "@components/utils/Each"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import { type Appointment } from "@public/json/appointment-list"

interface AppointmentListProps {
  items: Appointment[]
}

export default function AppointmentList({ items }: AppointmentListProps) {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("_appointment")
  
  const router = useRouter()
  
  const setAppointment = (appointmentId: string) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("_appointment", appointmentId)
    router.push(`?${searchParams.toString()}`)
  }

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        <Each
          of={items}
          render={(item) => (
            <button
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                appointmentId === item.id && "bg-muted"
              )}
              onClick={() => setAppointment(item.id)}
            >
              <div className="flex items-center gap-2 w-full">
                <Avatar>
                  <AvatarImage src={item.patientAvatar} alt={item.name} />
                  <AvatarFallback>
                    {item.name
                      .split(" ")
                      .map((chunk) => chunk[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{item.name}</div>
                      {!item.read && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "ml-auto text-xs",
                        appointmentId === item.id
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <div className="text-xs font-medium">{item.subject} (<span>{formatRelative(item.bookingDateTime, new Date())}</span>)</div>
                </div>
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.complaint.substring(0, 300)}
              </div>
              {item.labels.length ? (
                <div className="flex items-center gap-2">
                  <Each
                    of={item.labels}
                    render={(label) => (
                      <Badge variant={getBadgeVariantFromLabel(label)}>
                        {label}
                      </Badge>
                    )}
                  />
                </div>
              ) : null}
            </button>
          )}
        />
      </div>
    </ScrollArea>
  )
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["new"].includes(label.toLowerCase())) {
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
