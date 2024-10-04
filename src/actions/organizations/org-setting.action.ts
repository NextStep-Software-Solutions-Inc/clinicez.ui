"use server";
import "server-only";

import prismaCommon from "@lib/prisma-common";
import { Prisma } from '@prisma/common/client';
import { cache } from "react";

export type GetOrgSetting = Awaited<ReturnType<typeof getOrgSettingAction>>
export const getOrgSettingAction = cache(async (orgUid: string) => {
  try {
    const orgSetting = await prismaCommon.organizationSetting.findFirst({
      where: { Organization: { orgId: orgUid } },
      include: {
        Organization: {
          select: {
            OrgAppointmentConfig: true,
            OrgConsultationConfig: true
          }
        }
      }
    });
    return {
      status: true,
      message: "Org settings fetched successfully",
      data: orgSetting
    }
  } catch (error) {
    console.error(error);
    let errorMessage = "Error while fetching org settings";
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      errorMessage = "Organization not found";
    }
    return {
      status: false,
      message: errorMessage,
      data: null
    }
  }
});

type UpsertOrganizationSetting = {
  enableAppointment?: boolean;
  enableConsultation?: boolean;
  orgUid: string;
}
export const upsertOrgSettingsAction = async (orgSettingId: number, { enableAppointment, enableConsultation, orgUid }: UpsertOrganizationSetting) => {
  try {
    const orgSetting = await prismaCommon.organizationSetting.upsert({
      where: { 
        id: orgSettingId
      },
      create: {
        Organization: {
          connect: {
            orgId: orgUid
          }
        },
        enableAppointment,
        enableConsultation,
      },
      update: {
        Organization: {
          connect: {
            orgId: orgUid
          }
        },
        enableAppointment,
        enableConsultation,
      },
      include: {
        Organization: {
          select: {
            OrgAppointmentConfig: true,
            OrgConsultationConfig: true
          }
        }
      }
    });
    return {
      status: true,
      message: "Organization settings updated successfully",
      data: orgSetting
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Error while updating organization settings",
      data: null
    }
  }
};