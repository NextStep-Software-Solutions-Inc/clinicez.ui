import { type GetAppointment } from '@actions/appointments/appointments.action';
import RejectAppointment from "./RejectAppointment"
import AcceptAppointmentAssignment from "./AcceptAppointmentAssignment"
import ReceiveAppointment from "./ReceiveAppointment"
import AssignAppointment from "@components/appointment/AssignAppointment"
import RescheduleAppointment from "@components/appointment/RescheduleAppointment"
import DeclineAppointmentAssignment from "@components/appointment/DeclineAppointmentAssignment"
import CreateConsultationTicketModal from './CreateConsultationTicketModal';
import { useHPs } from '@hooks/useHP';
import { useUser } from '@auth0/nextjs-auth0/client';
import AddVitalSignsModal from '../../app/(main)/user/[user]/phr/vitals/AddVitalSignsModal';
import { Button } from '@components/ui/button';
import { Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';

type AppointmentActions = "accept"|"decline"|"approve"|"receive"| "reject" | "assign" | "create-consultation-ticket"| "reschedule" | "add-vitals"
type AppointmentStatusTools = {
    action: AppointmentActions
    permissions: string[],
    appointmentStatuses: string[],
    routedAptStatuses: string[],
    component: React.ReactNode
}[]

interface UseAppointmentToolsProps {
    appointment?: GetAppointment["data"],
    revalidate: () => void
}
export const useAppointmentTools = ({ appointment, revalidate}:UseAppointmentToolsProps) => {

  const {user} = useUser()
  const {data: authHps} = useHPs({
    userId: user?.sub ?? undefined
  })
  const routingCode = appointment?.AppointmentRouting.find(r => authHps?.some(hp => hp.id === Number(r.routedTo)))?.routingCode
  if(!appointment) return { tools: [] }
  const patientId = appointment.Requesters[0].userId
  const tools: AppointmentStatusTools = [
    {
      action:"accept",
      permissions: ["accept:org:appointment"],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: routingCode ? (
        <AcceptAppointmentAssignment
          key={`${appointment.id}-accept`}
          routingCode={routingCode}
          onAccepted={revalidate}
          disabled={!appointment} 
        />
      ) : null
    },
    {
      action:"decline",
      permissions: ["decline:org:appointment"],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: routingCode ? (
        <DeclineAppointmentAssignment 
          key={`${appointment.id}-decline`}
          routingCode={routingCode}
          disabled={!appointment} 
          onDeclined={revalidate}
        />
      ) : null
    },
    {
      action:"receive",
      permissions: ["receive:org:appointment"],
      appointmentStatuses: ["all", "pending"],
      routedAptStatuses: [],
      component: <ReceiveAppointment 
        key={`${appointment.id}-receive`}
        orgUId={appointment.orgUid}
        appointmentId={appointment.id}
        onReceived={revalidate} 
        disabled={!appointment}
      />
    },
    {
      action:"reject",
      permissions: ["reject:org:appointment"],
      appointmentStatuses: ["all", "accepted", "pending"],
      routedAptStatuses: [],
      component: (
        <RejectAppointment 
          key={`${appointment.id}-reject`}
          appointmentId={appointment?.id}
          onRejected={revalidate} 
          disabled={!appointment}
        /> 
      )
    },
    {
      action:"create-consultation-ticket",
      permissions: ["create:org:consultation-ticket"],
      appointmentStatuses: ["routed"],
      routedAptStatuses: ["accepted"],
      component: (
        <CreateConsultationTicketModal 
          key={appointment.id} 
          appointment={appointment}
          disabled={!appointment} 
          subject={appointment?.subject ?? ""}
        />
      )
    },
    {
      action:"assign",
      permissions: ["assign:org:appointment"],
      appointmentStatuses: ["received", "routed"],
      routedAptStatuses: [],
      component: (
        <AssignAppointment 
          key={`${appointment.id}-assign`}
          appointment={appointment}
          onAssigned={revalidate} 
          disabled={!appointment}
        />
      )
    },
    {
      action:"reschedule",
      permissions: ["reschedule:org:appointment"],
      appointmentStatuses: ["received", "routed"],
      routedAptStatuses: ["accepted"],
      component: (
        <RescheduleAppointment 
          key={`${appointment.id}-reschedule`}
          appointment={appointment}
          disabled={!appointment}
          onRescheduled={revalidate}
        />
      )
    },
    {
      action:"add-vitals",
      permissions: ["write:org:vitals"],
      appointmentStatuses: ["received", "routed"],
      routedAptStatuses: [],
      component: (
        <Tooltip key={`${appointment.id}-add-vitals`}>
          <AddVitalSignsModal userId={patientId}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!appointment}>
                <Activity className="h-4 w-4" />
                <span className="sr-only">Add Vitals</span>
              </Button>
            </TooltipTrigger>
          </AddVitalSignsModal>
          <TooltipContent>Add Vitals</TooltipContent>
        </Tooltip>
      )
    }
  ]
  return {
    tools
  }
}