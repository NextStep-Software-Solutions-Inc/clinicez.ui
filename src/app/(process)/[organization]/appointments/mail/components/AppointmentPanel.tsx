"use client"

import * as React from "react"
import {
  Clock,
  Inbox,
  MailCheck,
  MailPlus,
  MailX,
  Route,
  Search,
  Trash2,
  User,
} from "lucide-react"

import { cn } from "@lib/utils"
import { Input } from "@components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable"
import { Separator } from "@components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import { TooltipProvider } from "@components/ui/tooltip"
import AppointmentList from "./AppointmentList"
import { Nav } from "./nav"
import { useRouter, useSearchParams } from "next/navigation"
import { Appointment } from "@public/json/appointment-list"
import { type AppointmentsCountsType } from "@actions/appointments.action"
import Switcher from "@components/dashboard/Switcher"
import { Badge } from "@components/ui/badge"
import { ScrollArea } from "@components/ui/scroll-area"

export type UserRoles = "student" | "faculty" | "admin" | "receptionist" | "doctor" | "nurse"
export type UserSwitcherType = {
  label: string
  role: UserRoles
  icon: React.ReactNode
}

const icons = {
  all: Inbox,
  pending: Inbox,
  received: MailPlus,
  reschedule: Clock,
  accepted: MailCheck,
  declined: MailX,
  rejected: Trash2,
  routed: Route,
};
const roles = [
  {
    label: "Student",
    value: "student",
    icon: User,
  },
  {
    label: "Faculty",
    value: "faculty",
    icon: User,
  },
  {
    label: "Admin",
    value: "admin",
    icon: User,
  }, 
  {
    label: "Receptionist",
    value: "receptionist",
    icon: User,
  }, 
  {
    label: "Doctor",
    value: "doctor",
    icon: User,
  },
  {
    label: "Nurse",
    value: "nurse",
    icon: User,
  }
]
const rolesLinks = {
  student: ["all", "pending", "received", "accepted", "declined", "rejected", "reschedule"],
  faculty: ["all", "pending", "received", "accepted", "declined", "rejected", "reschedule"],
  admin: ["pending", "received", "accepted", "declined", "rejected", "routed", "reschedule"],
  receptionist: ["pending", "received", "rejected", "routed", "reschedule"],
  doctor: ["pending", "accepted", "declined", "reschedule"],
  nurse: ["pending", "accepted", "declined", "reschedule"],
};
interface AppointmentPanelProps {
  appointmentsCounts: AppointmentsCountsType
  appointments: Appointment[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  children: React.ReactNode
}


export default function AppointmentPanel({
  appointmentsCounts,
  appointments,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
  children
}: AppointmentPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  const searchParams = useSearchParams();
  const router = useRouter();
  
  const type = searchParams.get("_type");
  const role = searchParams.get("_role") as UserRoles;
  const [query, setQuery] = React.useState("");

  const filteredAppointments = React.useMemo(() => {
    if (!query) return appointments;
    return appointments.filter((appointment) => {
      return (
        appointment.subject.toLowerCase().includes(query.toLowerCase()) ||
        appointment.complaint.toLowerCase().includes(query.toLowerCase())
      );
    });
  },[appointments,query])

  const updateQuery = (q: string) => {
    setQuery(q);
  }
  
  const isDefaultVariant = (activeTab: string): "default" | "ghost" => {
    return type === activeTab ? "default" : "ghost"
  }
  const link = (title: string, badge: string, icon: any, variant: string) => ({
    title,
    label: badge,
    icon,
    variant: isDefaultVariant(variant),
  });

  const sidebarLinksPerRole = Object.fromEntries(
    Object.entries(rolesLinks).map(([role, statuses]) => [
      role,
      statuses.map(status => link(
        status.charAt(0).toUpperCase() + status.slice(1),
        appointmentsCounts[status as keyof typeof appointmentsCounts].toString(),
        icons[status as keyof typeof icons],
        status
      )),
    ])
  );

  const changeRole = (role: string) => {
    if(window && role) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("_role", role);
      router.push(`?${searchParams.toString()}`);
    }
  }
  
  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        autoSaveId="appointment-panel"
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`
        }}
        className="h-full max-h-[85dvh] items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`
          }}
          onExpand={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`
          }}
          className={cn("py-1 h-[100dvh]",
            isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <div
            className={cn(
              "flex h-[52px] items-center justify-center",
              isCollapsed ? "h-[52px]" : "px-2"
            )}
          >
            <Switcher
              value={role}
              isCollapsed={isCollapsed}
              onSwitch={changeRole}
              options={roles}
            />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={sidebarLinksPerRole[role as keyof typeof sidebarLinksPerRole] ?? []}
          />
          <Separator />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="" defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all" className="flex h-full flex-col">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold capitalize">{type}</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All appointment
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" type="search" value={query} onChange={e => updateQuery(e.target.value)} />
                </div>
              </form>
            </div>
            <TabsContent value="all" asChild>
              <AppointmentList items={filteredAppointments} />
            </TabsContent>
            <TabsContent value="unread" asChild>
              <AppointmentList items={filteredAppointments.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
          <AppointmentList items={filteredAppointments} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]}>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
