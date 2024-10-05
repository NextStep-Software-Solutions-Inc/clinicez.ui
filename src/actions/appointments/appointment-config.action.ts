"use server";

import "server-only";

export type GetOrgAppointmentConfig = Awaited<ReturnType<typeof getOrgAppointmentConfigAction>>
export const getOrgAppointmentConfigAction = async (orgUid: string) => {
  const orgAppointmentConfig = await prismaCommon.orgAppointmentConfig.findFirst({
    where: {
      Organization: {
        orgId: orgUid
      }
    },
  });
  return orgAppointmentConfig;
}

type UpsertOrgAppointmentConfig = {
  maxAppointmentsPerClient?: number;
  perClientResetInterval?: number;
  maxAppointmentsPerDay?: number;
  perDayResetInterval?: number;
  orgUid: string;
}
export const upsertOrgAppointmentConfigAction = async (orgAppointmentConfigId: number, data: UpsertOrgAppointmentConfig) => {
  try {
    const orgAppointmentConfig = await prismaCommon.orgAppointmentConfig.upsert({
      where: {
        id: orgAppointmentConfigId
      },
      create: {
        Organization: {
          connect: {
            orgId: data.orgUid
          }
        },
        maxAppointmentsPerClient: data.maxAppointmentsPerClient,
        perClientResetInterval: data.perClientResetInterval,
        maxAppointmentsPerDay: data.maxAppointmentsPerDay,
        perDayResetInterval: data.perDayResetInterval
      },
      update: {
        maxAppointmentsPerClient: data.maxAppointmentsPerClient,
        perClientResetInterval: data.perClientResetInterval,
        maxAppointmentsPerDay: data.maxAppointmentsPerDay,
        perDayResetInterval: data.perDayResetInterval
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