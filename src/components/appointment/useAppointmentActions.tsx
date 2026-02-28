import { type GetAppointment } from '@actions/appointments/appointments.action';
import RejectAppointment from "./RejectAppointment"
import AcceptAppointmentAssignment from "./AcceptAppointmentAssignment"
import ReceiveAppointment from "./ReceiveAppointment"
import AssignAppointment from "@components/appointment/AssignAppointment"
import RescheduleAppointment from "@components/appointment/RescheduleAppointment"
import DeclineAppointmentAssignment from "@components/appointment/DeclineAppointmentAssignment"
import CreateConsultationTicketModal from './CreateConsultationTicketModal';
import { useHPs } from '@hooks/useHP';
import { useUser } from '@clerk/nextjs';
import { AddVitalSignsModal } from "@app/(v1)/(main)/user/[user]/phr/vitals";
import { Button } from '@components/ui/button';
import { Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { PERMISSIONS } from '@lib/permissions';
import ConfirmBooking from './ConfirmBooking';
import EMRTriggerButton from '../EMRTriggerButton';

type AppointmentActions = "accept" | "decline" | "approve" | "receive" | "reject" | "assign" | "create-consultation-ticket" | "reschedule" | "add-vitals" | "emr-preview" | "confirm-booking"
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
export const useAppointmentTools = ({ appointment, revalidate }: UseAppointmentToolsProps) => {

  const { user } = useUser()
  const { data: authHps } = useHPs({
    userId: user?.id ?? undefined
  })
  const routingCode = appointment?.AppointmentRouting.find(r => authHps?.some(hp => hp.id === r.RoutedTo.id && r.status === "PENDING"))?.routingCode
  if (!appointment) return { tools: [] }

  // Check if appointment has any requesters at all
  if (!appointment.Requesters || appointment.Requesters.length === 0) {
    console.warn("Appointment has no requesters", appointment.id);
    return { tools: [] };
  }

  // Safely get the patient ID, handling null User relationships
  const validRequester = appointment.Requesters.find(r => r.User?.userId);
  const patientId = validRequester?.User?.userId;

  if (!patientId) {
    console.warn("No valid patient found in appointment requesters", appointment.id);
    return { tools: [] };
  }

  const tools: AppointmentStatusTools = [
    {
      action: "accept",
      permissions: [PERMISSIONS.CLINIC["ACCEPT:CLINIC:APPOINTMENT_ASSIGNMENT"].name],
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
      action: "decline",
      permissions: [PERMISSIONS.CLINIC["DECLINE:CLINIC:APPOINTMENT_ASSIGNMENT"].name],
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
      action: "receive",
      permissions: [PERMISSIONS.CLINIC["RECEIVE:CLINIC:APPOINTMENT"].name],
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
      action: "reject",
      permissions: [PERMISSIONS.CLINIC["REJECT:CLINIC:APPOINTMENT"].name],
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
      action: "create-consultation-ticket",
      permissions: [PERMISSIONS.CLINIC["CREATE:CLINIC:CONSULTATION_TICKET"].name],
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
      action: "assign",
      permissions: [PERMISSIONS.CLINIC["ASSIGN:CLINIC:APPOINTMENT"].name],
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
      action: "reschedule",
      permissions: [PERMISSIONS.CLINIC["RESCHEDULE:CLINIC:APPOINTMENT"].name],
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
      action: "add-vitals",
      permissions: [PERMISSIONS.CLINIC["WRITE:CLINIC:VITAL_SIGNS"].name],
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
      action: "emr-preview",
      permissions: [PERMISSIONS.CLINIC["READ:CLINIC:APPOINTMENT:OWN"].name],
      appointmentStatuses: ["routed", "accepted", "pending", "received", "rescheduled"],
      routedAptStatuses: [],
      component: (
        <EMRTriggerButton
          key={`${appointment.id}-emr-preview`}
          patientId={patientId}
          variant="ghost"
          className="h-4 w-4"
          keyProp={`${appointment.id}-emr-preview`}
        />
      )
    },
    {
      action: "confirm-booking",
      permissions: [PERMISSIONS.CLINIC["CONFIRM:CLINIC:APPOINTMENT"].name],
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