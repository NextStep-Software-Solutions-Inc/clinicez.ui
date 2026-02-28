import type { GetAppointments } from "@/actions/appointments/appointments.action";

type Appointment = NonNullable<GetAppointments["data"]>[number];

const WALK_IN_PREFIX = /^Walk-in:\s*/i;

/** Returns true when the appointment has no registered requester and was created as a walk-in. */
export function isWalkInAppointment(appointment: Appointment): boolean {
  return !appointment.Requesters?.[0]?.User && WALK_IN_PREFIX.test(appointment.subject);
}

/** Returns the patient's display name for an appointment. Walk-in name is extracted from the subject. */
export function getAppointmentPatientName(appointment: Appointment): string {
  const requester = appointment.Requesters?.[0]?.User;
  if (requester) {
    return `${requester.firstName ?? ""} ${requester.middleName ? requester.middleName + " " : ""}${requester.lastName ?? ""}${requester.suffix ? " " + requester.suffix : ""}`.trim() || "Unknown Patient";
  }
  if (WALK_IN_PREFIX.test(appointment.subject)) {
    return appointment.subject.replace(WALK_IN_PREFIX, "").trim();
  }
  return "Unknown Patient";
}

/** Returns initials for the avatar display. */
export function getAppointmentInitials(appointment: Appointment): string {
  const requester = appointment.Requesters?.[0]?.User;
  if (requester) {
    return `${requester.firstName?.charAt(0) ?? ""}${requester.lastName?.charAt(0) ?? ""}`;
  }
  const name = getAppointmentPatientName(appointment);
  return name.charAt(0) || "?";
}
