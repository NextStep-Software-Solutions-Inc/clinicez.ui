"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrgAppointmentConfig = Awaited<ReturnType<typeof getOrgAppointmentConfigAction>>
export const getOrgAppointmentConfigAction = async (clinicUid: string) => {
  const orgAppointmentConfig = await prisma.appointmentConfig.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    },
  });
  return orgAppointmentConfig;
}

type UpsertAppointmentConfig = {
  maxAppointmentsPerClient?: number;
  perClientResetInterval?: number;
  maxAppointmentsPerDay?: number;
  clinicUid: string;
}
export const upsertOrgAppointmentConfigAction = async (appointmentConfigId: number, data: UpsertAppointmentConfig) => {
  try {
    const orgAppointmentConfig = await prisma.appointmentConfig.upsert({
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
      data: orgAppointmentConfig
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