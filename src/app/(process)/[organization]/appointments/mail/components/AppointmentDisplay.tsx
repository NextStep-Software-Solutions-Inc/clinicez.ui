"use client";

import {differenceInCalendarYears } from "date-fns"
import {
  Forward,
  MoreVertical,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/avatar"
import { Button } from "@components/ui/button"

import { Separator } from "@components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip"
import CreateConsultationRecordModal from "../../components/CreateConsultationRecordModal"
import { ScrollArea } from "@components/ui/scroll-area"
import Image from "next/image"
import Each from "@components/utils/Each"
import RejectAppointment from "../../components/RejectAppointment"
import AcceptAppointmentAssignment from "../../components/AcceptAppointmentAssignment"
import ReceiveAppointment from "../../components/ReceiveAppointment"
import { AppointmentStatus } from "@public/json/appointment-list"
import AssignAppointment from "../../components/AssignAppointment"
import RescheduleAppointment from "../../components/RescheduleAppointment"
import DeclineAppointmentAssignment from "../../components/DeclineAppointmentAssignment"
import { UserRoles } from "./AppointmentPanel"
import { Badge } from "@components/ui/badge"
import ConsultationRecordSheet from "../../components/ConsultationRecordSheet"
import { SheetTrigger } from "@components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { useParams, useSearchParams } from "next/navigation"
import { useUser } from "@hooks/useUser";
import { useOrgAppointment } from "@hooks/useAppointment";
import PageLoading from "@components/PageLoading";

export default function AppointmentDisplay() {

  const params = useParams()
  const searchParams = useSearchParams()
  const organization = params?.organization as string
  const appointmentId = parseInt(searchParams.get("_appointment") ?? "")
  const role = searchParams.get("_role") as UserRoles
  
  const {data: freshAppointment, isLoading: loadingAppointment} = useOrgAppointment({
    orgId: organization,
    appointmentId: appointmentId
  })

  const {data: user, isLoading: loadingUser} = useUser({email: freshAppointment?.Requesters[0].email})
  

  if (!appointmentId) {
    return <div className="p-8 text-center text-muted-foreground">No appointment selected</div>
  }

  if (loadingAppointment || !freshAppointment) {
    return <PageLoading label="Loading Appointment" />
  };
  if (loadingUser || !user) {
    return <PageLoading label="Loading User" />
  };
  
  const appointmentToolsPerStatus: Record<AppointmentStatus, React.ReactNode> = {
    all: (<></>),
    pending: 
      <>
        {["doctor", "nurse"].includes(role) && (
          <>
            <AcceptAppointmentAssignment disabled={!freshAppointment}/> 
            <DeclineAppointmentAssignment disabled={!freshAppointment}/> 
          </>
        )}
        {["receptionist"].includes(role) && (
          <>
            <ReceiveAppointment disabled={!freshAppointment}/>
            <RejectAppointment disabled={!freshAppointment}/>  
          </>
        )}
      </>,
    accepted: (
      <>
        {["doctor", "nurse"].includes(role) && <CreateConsultationRecordModal disabled={!freshAppointment} subject={freshAppointment?.subject ?? ""}/>}
      </>
    ),
    rejected: (<></>),
    received: (
      <>
        <AssignAppointment disabled={!freshAppointment} />
      </>
    ),
    routed: (<></>),
    reschedule: (<></>)
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="capitalize">{freshAppointment?.AppointmentAttribute?.status}</Badge>
          {/* <RescheduleAppointment disabled={!freshAppointment} bookingDateTime={freshAppointment?.bookingDateTime? new Date(freshAppointment?.bookingDateTime): new Date()}/> */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          {
            appointmentToolsPerStatus[freshAppointment?.AppointmentAttribute?.status as AppointmentStatus] ?? []
          }
        </div>
        <div className="ml-auto flex items-center gap-2">
            
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
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

            </DropdownMenuContent>
          </DropdownMenu>
        </ConsultationRecordSheet>
      </div>
      <Separator />
      {freshAppointment ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage src={user.picture ?? ""} alt={user.nickname ?? ""} />
                <AvatarFallback>
                  {user.firstName?.charAt(0)} {user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{user.firstName} {user.lastName} - <span className="i">{user.email}</span></div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">{user.gender} / </span>{user.dob ? differenceInCalendarYears(new Date(), user.dob) : 0}
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
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  )
}
