
import {format } from "date-fns"
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
import { getAppointment } from "@actions/appointments.action"
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
import { DropdownMenuProvider } from "@components/DropdownMenuProvider"
import AppointmentMoreAction from "../../components/AppointmentMoreAction"

interface AppointmentDisplayProps {
  appointmentId: string | null
  role: UserRoles,
}

export default async function AppointmentDisplay({ appointmentId, role }: AppointmentDisplayProps) {
  
  const freshAppointment = await getAppointment(appointmentId ?? "")
  

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
          <Badge variant="default" className="capitalize">{freshAppointment?.status}</Badge>
          <RescheduleAppointment disabled={!freshAppointment} bookingDateTime={freshAppointment?.bookingDateTime? new Date(freshAppointment?.bookingDateTime): new Date()}/>
          <Separator orientation="vertical" className="mx-1 h-6" />
          {
            appointmentToolsPerStatus[freshAppointment?.status as AppointmentStatus] ?? []
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
        <DropdownMenuProvider>
          <AppointmentMoreAction>
            <Button variant="ghost" size="icon" disabled={!freshAppointment}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </AppointmentMoreAction>
        </DropdownMenuProvider>
      </div>
      <Separator />
      {freshAppointment ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage src={freshAppointment.patientAvatar} alt={freshAppointment.name} />
                <AvatarFallback>
                  {freshAppointment.name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{freshAppointment.name}</div>
                <div className="line-clamp-1 text-xs">{freshAppointment.subject}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Email:</span> {freshAppointment.email}
                </div>
              </div>
            </div>
            {freshAppointment.createdAt && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(new Date(freshAppointment.bookingDateTime), "PPpp")}
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
                    <Image width={150} height={150} className="rounded w-full" src="https://source.unsplash.com/random" alt="" />
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
