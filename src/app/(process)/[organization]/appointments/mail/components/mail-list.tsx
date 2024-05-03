import { ComponentProps } from "react"
import {formatDistanceToNow} from "date-fns"

import { cn } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import { ScrollArea } from "@components/ui/scroll-area"
import { Mail } from "../data"
import { useRouter, useSearchParams } from "next/navigation"
import Each from "@components/utils/Each"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"

interface MailListProps {
  items: Mail[]
}

export function MailList({ items }: MailListProps) {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointment")
  console.log({appointmentId});
  
  const router = useRouter()
  
  const setAppointment = (appointmentId: string) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("appointment", appointmentId)
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
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
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
                      {formatDistanceToNow(new Date(item.date), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <div className="text-xs font-medium">{item.subject}</div>
                </div>
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.text.substring(0, 300)}
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
  if (["work"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
