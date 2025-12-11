"use client"

import * as React from "react"
import {
  Clock,
  Inbox,
  type LucideIcon,
  MailCheck,
  MailOpen,
  MailPlus,
  MailX,
  Route,
  Trash2,
  UserIcon,
  Mailbox,
  Tag,
} from "lucide-react"

import { cn } from "@lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable"
import { Separator } from "@components/ui/separator"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import { TooltipProvider } from "@components/ui/tooltip"
import { AppointmentStatusNav, AppointmentStatusNavProps } from "./AppointmentStatusNav"
import { useParams, useSearchParams } from "next/navigation"
import Switcher from "@components/dashboard/Switcher"
import { useClinicRoles } from "@/hooks/useClinicRole"
import { useUser } from "@clerk/nextjs"
import { useAtom } from "jotai"
import { userDefaultOrganizationRoleAtom } from "@state/user-role"
import AppointmentListWrapper from "../AppointmentListWrapper"

export type UserSwitcherType = {
  label: string
  role: string
  icon: React.ReactNode
}

const icons: Record<string, LucideIcon> = {
  all: Mailbox,
  pending: Inbox,
  received: MailPlus,
  rescheduled: Clock,
  accepted: MailCheck,
  declined: MailX,
  rejected: Trash2,
  routed: Route,
  completed: MailOpen,
  tagged: Tag,
};


const createStatusLinks = (
  statusesWithRoles: Record<string, number[]>,
  statusCounts: Record<string, number> | undefined,
  currentStatus: string | null,
  params: (status: string) => { key: string, value: string | null }[]
) => {
  return Object.entries(statusesWithRoles).reduce((acc, [status, roles]) => {
    roles.forEach(role => {
      if (!acc[role]) acc[role] = [];
      const count = statusCounts?.[status.toLocaleUpperCase()] ?? 0;
      acc[role].push({
        label: `${status.charAt(0).toLocaleUpperCase()}${status.slice(1)}`,
        badge: count > 0 ? count.toString() : "",
        params: params(status),
        icon: icons[status],
        variant: currentStatus === status ? "default" : "ghost",
      });
    });
    return acc;
  }, {} as Record<number, AppointmentStatusNavProps["links"]>);
};

interface AppointmentPanelProps {
  tabs: {
    name: string,
    description: string | null
    roles: { id: number, name: string }[]
  }[]
  appointmentStatusCounts?: Record<string, number>
  routedAppointmentStatusCounts?: Record<string, number>
  taggedAppointmentStatusCounts?: Record<string, number>
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  children: React.ReactNode
}

export default function AppointmentPanel({
  appointmentStatusCounts,
  routedAppointmentStatusCounts,
  taggedAppointmentStatusCounts,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
  children,
  tabs
}: AppointmentPanelProps) {

  const appointmentStatusAsTabs = tabs.filter(tab => tab.name.toLowerCase() !== "tagged").reduce((acc, tab) => {
    if (!Object.keys(icons).includes(tab.name)) return acc
    acc[tab.name] = [...new Set(tab.roles.map(role => role.id))]
    return acc
  }, {} as Record<string, number[]>)

  const inRouteAppointmentStatuses = ["pending", "accepted", "declined"].reduce((acc, tab) => {
    acc[tab] = [...new Set(tabs.flatMap(tab => tab.roles.map(role => role.id)))]
    return acc
  }, {} as Record<string, number[]>)


  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const searchParams = useSearchParams();
  const [userDefaultOrgRole, setUserDefaultClinicRole] = useAtom(userDefaultOrganizationRoleAtom)
  const { clinicUid } = useParams<{ clinicUid: string }>();
  const { user } = useUser();
  const userId = user?.id ?? undefined;
  const aptStatus = searchParams.get("_aptStatus");
  const sort = searchParams.get("_sort") ?? "request";
  const routedAptStatus = searchParams.get("_routedAptStatus");
  const isTaggedView = searchParams.get("_tagged") === "true";
  const activeRoleId = userDefaultOrgRole[clinicUid]?.roleId ?? 0;
  const { data: clinicRoles } = useClinicRoles({ userId })

  const roles = React.useMemo(() => (clinicRoles ?? [])?.map((role) => {
    return {
      label: role.name,
      value: role.id.toString(),
      icon: UserIcon,
      isDefault: role.UserDefaultClinicRoles.some((r) => r.User.userId === userId),
    }
  }), [clinicRoles, userId])

  const appointmentStatusLinks = React.useMemo(() => createStatusLinks(
    appointmentStatusAsTabs,
    appointmentStatusCounts,
    aptStatus,
    (status) => [{ key: "_aptStatus", value: status }, { key: "_routedAptStatus", value: null }, { key: "_tagged", value: null }, { key: "_appointment", value: null }]
  ), [appointmentStatusCounts, aptStatus, appointmentStatusAsTabs]);

  const routerAppointmentStatusLinks = React.useMemo(() => createStatusLinks(
    inRouteAppointmentStatuses,
    routedAppointmentStatusCounts,
    routedAptStatus,
    (status) => [{ key: "_routedAptStatus", value: status }, { key: "_aptStatus", value: "routed" }, { key: "_tagged", value: null }, { key: "_appointment", value: null }]
  ), [routedAppointmentStatusCounts, routedAptStatus, inRouteAppointmentStatuses]);

  const taggedAppointmentStatusLinks = React.useMemo(() => {
    const taggedTab = tabs.find(t => t.name === "tagged");
    if (!taggedTab) return {};

    return taggedTab.roles.reduce((acc, role) => {
      acc[role.id] = [{
        label: "Tagged",
        badge: taggedAppointmentStatusCounts?.ALL ? taggedAppointmentStatusCounts.ALL.toString() : "",
        params: [{ key: "_tagged", value: "true" }, { key: "_aptStatus", value: null }, { key: "_routedAptStatus", value: null }, { key: "_appointment", value: null }],
        icon: Tag,
        variant: isTaggedView ? "default" : "ghost",
      }];
      return acc;
    }, {} as Record<number, AppointmentStatusNavProps["links"]>);
  }, [taggedAppointmentStatusCounts, isTaggedView, tabs]);

  const changeRole = React.useCallback((roleId: string) => {
    const role = (clinicRoles ?? []).find((role) => role.id === Number(roleId))
    setUserDefaultClinicRole({
      [clinicUid]: {
        roleId: role?.id,
        roleName: role?.name
      }
    })
  }, [clinicRoles, clinicUid, setUserDefaultClinicRole])

  React.useEffect(() => {
    const defaultRole = clinicRoles?.flatMap(orgRole => orgRole.UserDefaultClinicRoles).find((r) => r.User.userId === userId)

    if (!defaultRole && clinicRoles?.length) {
      setUserDefaultClinicRole({
        [clinicUid]: {
          roleId: clinicRoles[0].id,
          roleName: clinicRoles[0].name
        }
      })
    } else if (defaultRole) {
      setUserDefaultClinicRole({
        [defaultRole.Clinic.clinicUid]: {
          roleId: defaultRole?.ClinicRole.id,
          roleName: defaultRole?.ClinicRole.name,
        }
      })
    }
  }, [clinicRoles, clinicUid, setUserDefaultClinicRole, userId])

  const handleSortTabChange = (value: string) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("_sort", value)
    history.pushState({}, "", `?${searchParams.toString()}`)
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
          <div className="px-5 pt-2 font-semibold">
            Appointments
          </div>
          <AppointmentStatusNav
            isCollapsed={isCollapsed}
            links={[...appointmentStatusLinks[activeRoleId as keyof typeof appointmentStatusLinks] ?? [], ...taggedAppointmentStatusLinks[activeRoleId as keyof typeof taggedAppointmentStatusLinks] ?? []]}
          />
          <Separator />
          {
            tabs.find(t => t.name === "in-route")?.roles.some(r => r.id === activeRoleId) &&
            (
              <>
                <div className="px-5 pt-2 font-semibold">
                  In-route Appointments
                </div>
                <AppointmentStatusNav
                  isCollapsed={isCollapsed}
                  links={routerAppointmentStatusLinks[activeRoleId as keyof typeof routerAppointmentStatusLinks] ?? []}
                />
                <Separator />
              </>
            )
          }

        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="" defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue={sort} onValueChange={handleSortTabChange} className="flex h-full flex-col">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold capitalize">{isTaggedView ? "Tagged" : routedAptStatus ? `Routed - ${routedAptStatus}` : aptStatus}</h1>
              <div className="ml-auto text-sm">
                <span className="mx-2">Sort by</span>
                <TabsList>
                  <TabsTrigger
                    value="request"
                    className="text-zinc-600 dark:text-zinc-200"
                  >
                    Request
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="text-zinc-600 dark:text-zinc-200"
                  >
                    Schedule
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <Separator />
            <AppointmentListWrapper clinicUid={clinicUid} />
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