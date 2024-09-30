import { type GetAppointment } from '@actions/appointments/appointments.action';
import RejectAppointment from "./RejectAppointment"
import AcceptAppointmentAssignment from "./AcceptAppointmentAssignment"
import ReceiveAppointment from "./ReceiveAppointment"
import AssignAppointment from "@components/appointment/AssignAppointment"
import RescheduleAppointment from "@components/appointment/RescheduleAppointment"
import DeclineAppointmentAssignment from "@components/appointment/DeclineAppointmentAssignment"
import CreateConsultationTicketModal from './CreateConsultationTicketModal';
import { useHP } from '@hooks/useHP';

type AppointmentActions = "accept"|"decline"|"approve"|"receive"| "reject" | "assign" | "create-consultation-ticket"| "reschedule"
type AppointmentStatusTools = {
    action: AppointmentActions
    permissions: string[],
    appointmentStatuses: string[],
    routedAptStatuses: string[],
    component: React.ReactNode
}[]


export const useAppointmentTools = ({ appointment, revalidate}: {
    appointment?: GetAppointment["data"],
    revalidate: () => void
}) => {
  const {data: authHp} = useHP(2)
  const routingCode = appointment?.AppointmentRouting.find(r => Number(r.routedTo) === authHp?.id)?.routingCode
  if(!appointment) return { tools: [] }
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
    }
  ]
  return {
    tools
  }
}