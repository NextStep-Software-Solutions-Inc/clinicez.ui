"use client"

import * as React from "react"
import {
  Clock,
  Inbox,
  type LucideIcon,
  MailCheck,
  MailPlus,
  MailX,
  Route,
  Trash2,
  UserIcon,
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
import {  AppointmentListWrapper } from "./AppointmentList"
import { AppointmentStatusNav, AppointmentStatusNavProps } from "./nav"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Switcher from "@components/dashboard/Switcher"
import { useOrgRoles } from "@hooks/useOrgRole"
import { useUser } from "@auth0/nextjs-auth0/client"

export type UserSwitcherType = {
  label: string
  role: string
  icon: React.ReactNode
}

const icons: Record<string, LucideIcon> = {
  all: Inbox,
  pending: Inbox,
  received: MailPlus,
  rescheduled: Clock,
  accepted: MailCheck,
  declined: MailX,
  rejected: Trash2,
  routed: Route,
};

const appointmentStatusesWithRoles = {
  all: ["student", "faculty", "admin", "receptionist", "doctor", "nurse"],
  pending: ["student", "faculty", "admin", "receptionist"],
  received: ["admin", "receptionist"],
  rejected: ["student", "faculty", "admin", "receptionist"],
  rescheduled: ["student", "faculty", "admin", "receptionist", "doctor", "nurse"],
  routed: ["student", "faculty", "admin", "receptionist", "doctor", "nurse"],
};

const routedAppointmentStatusesWithRoles = {
  pending: ["student", "faculty", "admin", "receptionist", "doctor", "nurse"],
  accepted: ["doctor", "nurse"],
  declined: ["doctor", "nurse"],
}

const createStatusLinks = (
  statusesWithRoles: Record<string, string[]>,
  statusCounts: Record<string, number> | undefined,
  currentStatus: string | null,
  params: (status: string) => { key: string, value: string | null }[]
) => {
  return Object.entries(statusesWithRoles).reduce((acc, [status, roles]) => {
    roles.forEach(role => {
      if (!acc[role]) acc[role] = [];
      acc[role].push({
        label: `${status.charAt(0).toLocaleUpperCase()}${status.slice(1)}`,
        badge: statusCounts?.[status.toLocaleUpperCase()]?.toString() ?? "0",
        params: params(status),
        icon: icons[status],
        variant: currentStatus === status ? "default" : "ghost",
      });
    });
    return acc;
  }, {} as Record<string, AppointmentStatusNavProps["links"]>);
};

interface AppointmentPanelProps {
  appointmentStatusCounts?: Record<string, number>
  routedAppointmentStatusCounts?: Record<string, number>
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  children: React.ReactNode
}

export default function AppointmentPanel({
  appointmentStatusCounts,
  routedAppointmentStatusCounts,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
  children
}: AppointmentPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const user = useUser();
  const userId = user?.user?.sub;
  
  const aptStatus = searchParams.get("_aptStatus");
  const routedAptStatus = searchParams.get("_routedAptStatus");
  const role = searchParams.get("_role")
  const organization = params.organization as string;
  const {data: orgRoles} = useOrgRoles(organization, {userId})

  const roles = React.useMemo(() => (orgRoles ?? [])?.map((role) => ({
    label: role.name,
    value: role.name.toLowerCase(),
    icon: UserIcon,
  })), [orgRoles])

  const appointmentStatusLinks = React.useMemo(() => createStatusLinks(
    appointmentStatusesWithRoles,
    appointmentStatusCounts,
    aptStatus,
    (status) => [{ key: "_aptStatus", value: status }, { key: "_routedAptStatus", value: null }, {key: "_appointment", value: null}]
  ), [appointmentStatusCounts, aptStatus]);
  
  const routerAppointmentStatusLinks = React.useMemo(() => createStatusLinks(
    routedAppointmentStatusesWithRoles,
    routedAppointmentStatusCounts,
    routedAptStatus,

    (status) => [{ key: "_routedAptStatus", value: status }, { key: "_aptStatus", value: "routed" }, {key: "_appointment", value: null}]
  ), [routedAppointmentStatusCounts, routedAptStatus]);

  const changeRole = React.useCallback((role: string) => {
    if(window && role) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("_role", role);
      router.push(`?${searchParams.toString()}`);
    }
  }, [router])
  
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
              value={role ?? ""}
              isCollapsed={isCollapsed}
              onSwitch={changeRole}
              options={roles}
            />
          </div>
          <Separator />
          <div className="px-5 pt-2 font-semibold">
            Appointments
          </div>
          <AppointmentStatusNav
            isCollapsed={isCollapsed}
            links={appointmentStatusLinks[role as keyof typeof appointmentStatusLinks] ?? []}
          />
          <Separator />
          <div className="px-5 pt-2 font-semibold">
            Routed Appointments
          </div>
          <AppointmentStatusNav
            isCollapsed={isCollapsed}
            links={routerAppointmentStatusLinks[role as keyof typeof routerAppointmentStatusLinks] ?? []}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="" defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all" className="flex h-full flex-col">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold capitalize">{aptStatus}</h1>
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
            <AppointmentListWrapper orgUid={organization}/>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]}>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}