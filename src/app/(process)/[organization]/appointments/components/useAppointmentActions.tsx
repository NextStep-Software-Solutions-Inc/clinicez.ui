import { type GetAppointment } from '@actions/appointments/appointments.action';
import RejectAppointment from "./RejectAppointment"
import AcceptAppointmentAssignment from "./AcceptAppointmentAssignment"
import ReceiveAppointment from "./ReceiveAppointment"
import AssignAppointment from "../components/AssignAppointment"
import RescheduleAppointment from "../components/RescheduleAppointment"
import DeclineAppointmentAssignment from "../components/DeclineAppointmentAssignment"
import CreateConsultationRecordModal from './CreateConsultationRecordModal';

type AppointmentActions = "accept"|"decline"|"approve"|"receive"| "reject" | "assign" | "create-consultation-record"| "reschedule"
type AppointmentStatusTools = {
    action: AppointmentActions
    roles: string[]
    permissions?: string[],
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
      roles: ["admin", "doctor", "nurse"],
      permissions: [],
      appointmentStatuses: ["all", "routed"],
      routedAptStatuses: ["pending"],
      component: (
        <AcceptAppointmentAssignment
          key={appointment.id}
          appointmentId={appointment.id}
          onAccepted={revalidate}
          disabled={!appointment} 
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
          key={appointment.id}
          disabled={!appointment} 
          appointmentId={appointment.id}
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
        key={appointment.id}
        appointmentId={appointment.id}
        onReceived={revalidate} 
        disabled={!appointment}
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
          key={appointment.id}
          appointmentId={appointment?.id}
          onRejected={revalidate} 
          disabled={!appointment}
        /> 
      )
    },
    {
      action:"create-consultation-record",
      roles: ["doctor"],
      permissions: [],
      appointmentStatuses: ["routed"],
      routedAptStatuses: ["accepted"],
      component: <CreateConsultationRecordModal key={appointment.id} disabled={!appointment} subject={appointment?.subject ?? ""}/>
    },
    {
      action:"assign",
      roles: ["admin", "doctor"],
      permissions: [],
      appointmentStatuses: ["received", "routed"],
      routedAptStatuses: [],
      component: (
        <AssignAppointment 
          key={appointment.id}
          appointmentId={appointment.id}
          onAssigned={revalidate} 
          disabled={!appointment}
        />
      )
    },
    // {
    //   action:"reschedule",
    //   roles: ["admin"],
    //   permissions: [],
    //   appointmentStatuses: ["received"],
    //   routedAptStatuses: [],
    //   component: <RescheduleAppointment 
    //     key={appointment.id}
    //     bookingDateTime={new Date()} disabled={!appointment} />
    // }
  ]
  return {
    tools
  }
}