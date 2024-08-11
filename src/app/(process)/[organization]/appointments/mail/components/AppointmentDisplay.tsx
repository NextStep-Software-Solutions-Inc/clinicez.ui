"use client";

import {differenceInCalendarYears } from "date-fns"
import {
  Forward,
  MoreVertical,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@components/ui/avatar"
import { Button } from "@components/ui/button"

import { Separator } from "@components/ui/separator"

import { ScrollArea } from "@components/ui/scroll-area"
import Image from "next/image"
import Each from "@components/utils/Each"
import { Badge } from "@components/ui/badge"
import ConsultationRecordSheet from "../../components/ConsultationRecordSheet"
import { SheetTrigger } from "@components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { useParams, useSearchParams } from "next/navigation"
import { useUser as useAptUser } from "@hooks/useUser";
import { useOrgAppointment } from "@hooks/useAppointment";
import PageLoading from "@components/PageLoading";
import { revalidatePath } from "@actions/cache.action";
import { mutate } from "swr";
import { useAppointmentTools } from "../../components/useAppointmentActions";
import { userDefaultOrganizationRoleAtom } from "@state/user-role";
import { useAtomValue } from "jotai";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function AppointmentDisplay() {

  const params = useParams()
  const searchParams = useSearchParams()
  const organization = params?.organization as string
  const appointmentId = parseInt(searchParams.get("_appointment") ?? "")
  const activeRole = useAtomValue(userDefaultOrganizationRoleAtom)[organization]?.roleName
  
  const {data: freshAppointment, isLoading: loadingAppointment} = useOrgAppointment({
    orgId: organization,
    appointmentId: appointmentId
  })

  const { user } = useUser()
  const {data: aptUser, isLoading: loadingUser} = useAptUser({email: freshAppointment?.Requesters[0].email})
  const {tools: appointmentTools} = useAppointmentTools({
    freshAppointment: freshAppointment,
    revalidate : async () => {
      revalidatePath(`${organization}/appointments`,  "page")
      mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/organizations/${organization}/appointments`), undefined, {
        revalidate:true
      })
    }
  })

  if (!appointmentId) {
    return <div className="p-8 text-center text-muted-foreground">No appointment selected</div>
  }
  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">User not found</div>
  }

  if (loadingAppointment) {
    return <PageLoading label="Loading Appointment" />
  };
  
  if (loadingUser) {
    return <PageLoading label="Loading User" />
  };

  if(!freshAppointment || !aptUser) {
    return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>
  }
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="capitalize">{freshAppointment?.AppointmentAttribute?.status}</Badge>
          {/* <RescheduleAppointment disabled={!freshAppointment} bookingDateTime={freshAppointment?.bookingDateTime? new Date(freshAppointment?.bookingDateTime): new Date()}/> */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Each
            of={appointmentTools.filter((tool) => {
              const enable = tool.roles.includes(activeRole ?? "") 
                && tool.appointmentStatuses.includes(freshAppointment.AppointmentAttribute?.status.toLocaleLowerCase() ?? "") 
                && (tool.routedAptStatuses.length === 0 || freshAppointment.AppointmentRouting.some(apt =>tool.routedAptStatuses.includes(apt.status.toLocaleLowerCase()) && apt.routedTo === user.email))
              return enable
            })}
            render={(tool) => tool.component}
            fallback={<span className="text-xs text-muted-foreground">No Action Available</span>}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip> */}
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <ConsultationRecordSheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SheetTrigger asChild>
                <DropdownMenuItem>
                  View Consultation Records
                </DropdownMenuItem>
              </SheetTrigger>
              <DropdownMenuItem>
                  View Assignment History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ConsultationRecordSheet>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Avatar>
              {
                aptUser.picture 
                  ? <Image src={aptUser.picture} width={50} height={50} className="object-cover" alt={aptUser.nickname ?? ""} />
                  : <AvatarFallback>{aptUser.firstName?.charAt(0)} {aptUser.lastName?.charAt(0)}</AvatarFallback>
              }
            </Avatar>
            <div className="grid gap-1">
              <div className="font-semibold">{aptUser.firstName} {aptUser.lastName} - <span className="i">{aptUser.email}</span></div>
              <div className="line-clamp-1 text-xs">
                <span className="font-medium">{aptUser.gender} / </span>{aptUser.dob ? differenceInCalendarYears(new Date(), aptUser.dob) : 0}
              </div>
              <div className="line-clamp-1 text-xs">{freshAppointment.subject}</div>

            </div>
          </div>
          {freshAppointment.createdAt && (
            <div className="ml-auto text-xs text-muted-foreground">
              {/* {format(new Date(freshAppointment.bookingDateTime), "PPpp")} */}
            </div>
          )}
        </div>
        <Separator />
        <ScrollArea className="flex-auto whitespace-pre-wrap p-4 text-sm  h-0">
          {freshAppointment.complaint}
            
          <Separator className="my-2" />
          <h5>Attachments</h5>
          <div className="flex flex-wrap gap-2">
            <Each
              of={Array(Math.floor(Math.random()*10)).fill(false)}
              render={() => (
                <div className="w-[200px] h-auto">
                  <Image width={150} height={150} className="rounded w-full" src="https://images.unsplash.com/photo-1721777436309-a5af4d4a4382?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
                </div>
              )}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
