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
import { PERMISSIONS } from '@lib/permissions';
import ConfirmBooking from './ConfirmBooking';

type AppointmentActions = "accept"|"decline"|"approve"|"receive"| "reject" | "assign" | "create-consultation-ticket"| "reschedule" | "add-vitals" | "confirm-booking"
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
  const routingCode = appointment?.AppointmentRouting.find(r => authHps?.some(hp => hp.id === Number(r.routedTo) && r.status === "PENDING"))?.routingCode
  if(!appointment) return { tools: [] }
  const patientId = appointment.Requesters[0].userId
  const tools: AppointmentStatusTools = [
    {
      action:"accept",
      permissions: [PERMISSIONS.ORGANIZATION["ACCEPT:ORG:APPOINTMENT_ASSIGNMENT"].name],
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
      permissions: [PERMISSIONS.ORGANIZATION["DECLINE:ORG:APPOINTMENT_ASSIGNMENT"].name],
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
      permissions: [PERMISSIONS.ORGANIZATION["RECEIVE:ORG:APPOINTMENT"].name],
      appointmentStatuses: ["all", "pending"],
      routedAptStatuses: [],
      component: <ReceiveAppointment 
        key={`${appointment.id}-receive`}
        appointmentId={appointment.id}
        onReceived={revalidate} 
        disabled={!appointment}
      />
    },
    {
      action:"reject",
      permissions: [PERMISSIONS.ORGANIZATION["REJECT:ORG:APPOINTMENT"].name],
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
      permissions: [PERMISSIONS.ORGANIZATION["CREATE:ORG:CONSULTATION_TICKET"].name],
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
      permissions: [PERMISSIONS.ORGANIZATION["ASSIGN:ORG:APPOINTMENT"].name],
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
      permissions: [PERMISSIONS.ORGANIZATION["RESCHEDULE:ORG:APPOINTMENT"].name],
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
      permissions: [PERMISSIONS.ORGANIZATION["WRITE:ORG:VITAL_SIGNS"].name],
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
    },
    {
      action:"confirm-booking",
      permissions: [PERMISSIONS.ORGANIZATION["CONFIRM:ORG:APPOINTMENT"].name],
      appointmentStatuses: ["routed"],
      routedAptStatuses: ["accepted"],
      component: (
        <ConfirmBooking 
          appointmentId={appointment.id}
          onAccepted={revalidate}
          key={`${appointment.id}-confirm`}
          disabled={!appointment.AppointmentAttribute?.date || !appointment.AppointmentAttribute?.timeStart || !appointment.AppointmentAttribute?.timeEnd} 
        />
      )
    }
  ]
  return {
    tools
  }
}