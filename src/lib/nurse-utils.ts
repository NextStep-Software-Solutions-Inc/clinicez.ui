import { GetAppointment } from "@actions/appointments/appointments.action";

/**
 * Constants for identifying nurse healthcare provider types
 */
export const NURSE_HP_TYPE_NAMES = ["nurse", "registered nurse", "rn"] as const;

/**
 * Checks if a healthcare provider type name indicates a nurse
 * @param hpTypeName - The name of the healthcare provider type
 * @returns true if the type is a nurse type
 */
export function isNurseHPType(hpTypeName: string | null | undefined): boolean {
  if (!hpTypeName) return false;
  const normalized = hpTypeName.toLowerCase().trim();
  return NURSE_HP_TYPE_NAMES.some(nurseType => normalized.includes(nurseType));
}

/**
 * Checks if a user is an assigned nurse to a specific appointment
 * @param appointment - The appointment data
 * @param userId - The user ID to check
 * @returns true if the user is assigned as a nurse to this appointment
 */
export function isAssignedNurseToAppointment(
  appointment: NonNullable<GetAppointment["data"]> | null | undefined,
  userId: string | null | undefined
): boolean {
  if (!appointment || !userId) return false;

  // Check if the user is assigned to this appointment as a nurse
  // through AppointmentRouting with status ACCEPTED
  const assignedAsNurse = appointment.AppointmentRouting?.some(routing => {
    const isAccepted = routing.status === "ACCEPTED";
    const isCurrentUser = routing.RoutedTo?.User?.userId === userId;
    const isNurse = isNurseHPType(routing.RoutedTo?.HPType?.name);

    return isAccepted && isCurrentUser && isNurse;
  });

  return assignedAsNurse ?? false;
}

/**
 * Checks if a user has any nurse healthcare provider role
 * @param hps - Array of healthcare providers associated with a user
 * @returns true if the user has at least one nurse HP role
 */
export function hasNurseRole(
  hps: Array<{ HPType: { name: string } }> | null | undefined
): boolean {
  if (!hps || hps.length === 0) return false;
  return hps.some(hp => isNurseHPType(hp.HPType.name));
}
