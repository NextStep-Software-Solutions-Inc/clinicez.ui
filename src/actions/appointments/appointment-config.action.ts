"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetClinicAppointmentConfig = Awaited<ReturnType<typeof getClinicAppointmentConfigAction>>
export const getClinicAppointmentConfigAction = async (clinicUid: string) => {
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
  clinicUid: string;
}
export const upsertClinicAppointmentConfigAction = async (appointmentConfigId: number, data: UpsertAppointmentConfig) => {
  try {
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
      },
      update: {
        maxAppointmentsPerClient: data.maxAppointmentsPerClient,
        perClientResetInterval: data.perClientResetInterval,
        maxAppointmentsPerDay: data.maxAppointmentsPerDay,
      }
    });
    return {
      status: true,
      message: "Appointment settings updated successfully",
      data: clinicAppointmentConfig
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Failed to update appointment settings",
      data: null
    }
  }
}