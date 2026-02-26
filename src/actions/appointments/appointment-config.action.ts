"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export type GetClinicAppointmentConfig = Awaited<ReturnType<typeof getClinicAppointmentConfigAction>>
export const getClinicAppointmentConfigAction = async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const clinicAppointmentConfig = await prisma.appointmentConfig.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    },
  });
  return clinicAppointmentConfig;
}

type UpsertAppointmentConfig = {
  maxAppointmentsPerClient?: number;
  perClientResetInterval?: number;
  maxAppointmentsPerDay?: number;
  privacyPolicyUrl?: string;
  termsAndConditionsUrl?: string;
  clinicUid: string;
}
export const upsertClinicAppointmentConfigAction = async (appointmentConfigId: number, data: UpsertAppointmentConfig) => {
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canUpdateSettings = [PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name].some(p => myPermissionArray.includes(p));
    if (!canUpdateSettings) throw new Error("You do not have permission to update appointment settings.");

    const clinicAppointmentConfig = await prisma.appointmentConfig.upsert({
      where: {
        id: appointmentConfigId
      },
      create: {
        Clinic: {
          connect: {
            clinicUid: data.clinicUid
          }
        },
        maxAppointmentsPerClient: data.maxAppointmentsPerClient,
        perClientResetInterval: data.perClientResetInterval,
        maxAppointmentsPerDay: data.maxAppointmentsPerDay,
        privacyPolicyUrl: data.privacyPolicyUrl,
        termsAndConditionsUrl: data.termsAndConditionsUrl,
      },
      update: {
        maxAppointmentsPerClient: data.maxAppointmentsPerClient,
        perClientResetInterval: data.perClientResetInterval,
        maxAppointmentsPerDay: data.maxAppointmentsPerDay,
        privacyPolicyUrl: data.privacyPolicyUrl,
        termsAndConditionsUrl: data.termsAndConditionsUrl,
      }
    });
    return {
      status: true,
      message: "Appointment settings updated successfully",
      data: clinicAppointmentConfig
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to update appointment settings";
    if (error instanceof Error) message = error.message;
    return {
      status: false,
      message,
      data: null
    }
  }
}