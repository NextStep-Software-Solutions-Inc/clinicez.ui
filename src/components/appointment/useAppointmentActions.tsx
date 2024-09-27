import { type GetAppointment } from '@actions/appointments/appointments.action';
import RejectAppointment from "./RejectAppointment"
import AcceptAppointmentAssignment from "./AcceptAppointmentAssignment"
import ReceiveAppointment from "./ReceiveAppointment"
import AssignAppointment from "@components/appointment/AssignAppointment"
import RescheduleAppointment from "@components/appointment/RescheduleAppointment"
import DeclineAppointmentAssignment from "@components/appointment/DeclineAppointmentAssignment"
import CreateConsultationTicketModal from './CreateConsultationTicketModal';

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
  
  if(!appointment) return { tools: [] }
  const tools: AppointmentStatusTools = [
    {
      action:"accept",
      permissions: ["accept:org:appointment"],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: (
        <AcceptAppointmentAssignment
          key={`${appointment.id}-accept`}
          appointmentId={appointment.id}
          onAccepted={revalidate}
          disabled={!appointment} 
        />
      )
    },
    {
      action:"decline",
      permissions: ["decline:org:appointment"],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: (
        <DeclineAppointmentAssignment 
          key={`${appointment.id}-decline`}
          disabled={!appointment} 
          appointmentId={appointment.id}
          onDeclined={revalidate}
        />
      )
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
      component: <CreateConsultationTicketModal key={appointment.id} disabled={!appointment} subject={appointment?.subject ?? ""}/>
    },
    {
      action:"assign",
      permissions: ["assign:org:appointment"],
      appointmentStatuses: ["received", "routed"],
      routedAptStatuses: [],
      component: (
        <AssignAppointment 
          key={`${appointment.id}-assign`}
          appointmentId={appointment.id}
          onAssigned={revalidate} 
          disabled={!appointment}
          preferredAppointee={appointment.AppointmentAttribute?.preferredAppointee}
          assigned={appointment.AppointmentRouting?.map(r => ({
            email: r.routedTo,
            role: r.routedToRole,
            status: r.status
          }))}
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
          key={appointment.id}
          serviceId={appointment.AppointmentAttribute?.Service?.id ?? 0}
          appointmentTypeId={appointment.AppointmentAttribute?.AppointmentType?.id ?? 0}
          preferredDate={new Date()} 
          preferredUserId={appointment.AppointmentAttribute?.preferredAppointee}
          disabled={!appointment}
        />
      )
    }
  ]
  return {
    tools
  }
}