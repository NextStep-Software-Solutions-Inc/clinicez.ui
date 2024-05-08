"use client"

import * as React from "react"
import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  User,
  Users2,
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
import AppointmentDisplay from "./AppointmentDisplay"
import AppointmentList from "./AppointmentList"
import { Nav } from "./nav"
import { RoleSwitcher } from "@components/dashboard/RoleSwitcher"
import { useRouter, useSearchParams } from "next/navigation"
import { Appointment } from "@public/json/appointment-list"

interface AppointmentPanelProps {
  accounts: {
    label: string
    email: string
    icon: React.ReactNode
  }[]
  appointments: Appointment[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  children: React.ReactNode
}



export default function AppointmentPanel({
  appointments,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
  children
}: AppointmentPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const appointmentId = searchParams.get("appointment");
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
  
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", tab? tab : "pending");
    if(!tab) router.replace(`?${searchParams.toString()}`);
  }, [router, tab])
  
  const isDefaultVariant = (activeTab: string, ) => {
    return tab === activeTab ? "default" : "ghost"
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`
        }}
        className="h-full max-h-[80dvh] items-stretch"
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
          className={cn("py-1",
            isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <div
            className={cn(
              "flex h-[52px] items-center justify-center",
              isCollapsed ? "h-[52px]" : "px-2"
            )}
          >
            <RoleSwitcher
              isCollapsed={isCollapsed}
              accounts={[
                {
                  label: "Student",
                  email: "student@email.com",
                  icon: <User className="h-4 w-4" />,
                },
                {
                  label: "Faculty",
                  email: "faculty@email.com",
                  icon: <Users2 className="h-4 w-4" />,
                },
                {
                  label: "Admin",
                  email: "admin@email.com",
                  icon: <Archive className="h-4 w-4" />,
                }, 
                {
                  label: "Receptionist",
                  email: "receptionist@email.com",
                  icon: <Trash2 className="h-4 w-4" />,
                }, 
                {
                  label: "Doctor",
                  email: "doctor@email.com",
                  icon: <ShoppingCart className="h-4 w-4" />,
                },
                {
                  label: "Nurse",
                  email: "nurse@email.com",
                  icon: <ShoppingCart className="h-4 w-4" />,
                }
              ]}/>
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Pending",
                label: "128",
                icon: Inbox,
                variant: isDefaultVariant("pending"),
              },
              {
                title: "Received",
                label: "9",
                icon: File,
                variant: isDefaultVariant("received"),
              },
              {
                title: "Accepted",
                label: "",
                icon: Send,
                variant: isDefaultVariant("accepted"),
              },
              {
                title: "Rejected",
                label: "",
                icon: Trash2,
                variant: isDefaultVariant("rejected"),
              },
              {
                title: "Routed",
                label: "23",
                icon: ArchiveX,
                variant: isDefaultVariant("routed"),
              },
              {
                title: "Reschedule",
                label: "",
                icon: Archive,
                variant: isDefaultVariant("reschedule"),
              },
            ]}
          />
          <Separator />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold capitalize">{tab}</h1>
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
            <TabsContent value="all" className="m-0">
              <AppointmentList items={filteredAppointments} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <AppointmentList items={filteredAppointments.filter((item) => !item.read)} />
            </TabsContent>
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
