"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@lib/utils"
import { buttonVariants } from "@components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip"
import Each from "@components/utils/Each"

export interface AppointmentStatusNavProps {
  isCollapsed: boolean
  links: {
    label: string
    badge: string
    params: {
      key: string
      value: string | null
    }[]
    icon: LucideIcon
    variant: "default" | "ghost"
  }[]
}

export function AppointmentStatusNav({ links, isCollapsed }: AppointmentStatusNavProps) {

  const pushSearchParams = (params: {key:string, value:string | null}[]) => {
    const searchParams = new URLSearchParams(window.location.search);
    params.forEach(({key, value}) => {
      if(value === null) searchParams.delete(key);
      else searchParams.set(key, value);
    });
    window.history.pushState({}, "", `?${searchParams.toString()}`);
  }
  
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <Each
          of={links}
          render={(link, index) =>
            isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => pushSearchParams(link.params)}
                    className={cn(
                      buttonVariants({ variant: link.variant, size: "icon" }),
                      "h-9 w-9",
                      link.variant === "default" &&
                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="sr-only">{link.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {link.label}
                  {link.badge && (
                    <span className="ml-auto text-muted-foreground">
                      {link.badge}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div
                onClick={() => pushSearchParams(link.params)}
                className={cn(
                  buttonVariants({ variant: link.variant, size: "sm" }),
                  link.variant === "default" &&
                    "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                  "justify-start"
                )}
              >
                <link.icon className="mr-2 h-4 w-4" />
                {link.label}
                {link.badge && (
                  <span
                    className={cn(
                      "ml-auto",
                      link.variant === "default" &&
                        "text-background dark:text-white"
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </div>
            )}
        />
      </nav>
    </div>
  )
}
