import { type GetAppointment } from '@actions/appointments/appointments.action';
import RejectAppointment from "./RejectAppointment"
import AcceptAppointmentAssignment from "./AcceptAppointmentAssignment"
import ReceiveAppointment from "./ReceiveAppointment"
import AssignAppointment from "../components/AssignAppointment"
import RescheduleAppointment from "../components/RescheduleAppointment"
import DeclineAppointmentAssignment from "../components/DeclineAppointmentAssignment"
import CreateConsultationRecordModal from './CreateConsultationRecordModal';

type AppointmentActions = "accept"|"decline"|"approve"|"receive"| "reject" | "assign" | "create-consultation-notes"| "reschedule"
type AppointmentStatusTools = {
    action: AppointmentActions
    roles: string[]
    permissions?: string[],
    appointmentStatuses: string[],
    routedAptStatuses: string[],
    component: React.ReactNode
}[]


export const useAppointmentTools = ({ freshAppointment, revalidate}: {
    freshAppointment?: GetAppointment,
    revalidate: () => void
}) => {
  
  if(!freshAppointment) return { tools: [] }
  const tools: AppointmentStatusTools = [
    {
      action:"accept",
      roles: ["admin", "doctor", "nurse"],
      permissions: [],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: (
        <AcceptAppointmentAssignment
          appointmentId={freshAppointment.id}
          onAccepted={revalidate}
          disabled={!freshAppointment} 
        />
      )
    },
    {
      action:"decline",
      roles: ["admin", "doctor", "nurse"],
      permissions: [],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: (
        <DeclineAppointmentAssignment 
          disabled={!freshAppointment} 
          appointmentId={freshAppointment.id}
          onDeclined={revalidate}
        />
      )
    },
    {
      action:"receive",
      roles: ["admin"],
      permissions: [],
      appointmentStatuses: ["all", "pending"],
      routedAptStatuses: [],
      component: <ReceiveAppointment 
        appointmentId={freshAppointment.id}
        onReceived={revalidate} 
        disabled={!freshAppointment}
      />
    },
    {
      action:"reject",
      roles: ["admin", ],
      permissions: [],
      appointmentStatuses: ["all", "accepted", "pending"],
      routedAptStatuses: [],
      component: (
        <RejectAppointment 
          appointmentId={freshAppointment.id}
          onRejected={revalidate} 
          disabled={!freshAppointment}
        /> 
      )
    },
    {
      action:"create-consultation-notes",
      roles: ["admin", "doctor", "nurse"],
      permissions: [],
      appointmentStatuses: ["routed"],
      routedAptStatuses: ["accepted"],
      component: <CreateConsultationRecordModal disabled={!freshAppointment} subject={freshAppointment?.subject ?? ""}/>
    },
    {
      action:"assign",
      roles: ["admin"],
      permissions: [],
      appointmentStatuses: ["received"],
      routedAptStatuses: [],
      component: (
        <AssignAppointment 
          appointmentId={freshAppointment.id}
          onAssigned={revalidate} 
          disabled={!freshAppointment}
        />
      )
    },
    {
      action:"reschedule",
      roles: ["admin"],
      permissions: [],
      appointmentStatuses: ["received"],
      routedAptStatuses: [],
      component: <RescheduleAppointment bookingDateTime={new Date()} disabled={!freshAppointment} />
    }
  ]
  return {
    tools
  }
}