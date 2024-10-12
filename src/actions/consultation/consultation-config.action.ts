"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";

export type GetOrgConsultationConfig = Awaited<ReturnType<typeof getOrgConsultationConfigAction>>
export const getOrgConsultationConfigAction = async (orgUid: string) => {
  
  const orgConsultationConfig = await prismaCommon.orgConsultationConfig.findFirst({
    where: {
      Organization: {
        orgId: orgUid
      }
    },
  });
  return orgConsultationConfig;
}

type UpsertOrgConsultationConfig = {
  noteTemplateId?: number;
  orgUid: string;
}
export const upsertOrgConsultationConfigAction = async (orgConsultationConfigId: number, data: UpsertOrgConsultationConfig) => {
  try {
    const orgConsultationConfig = await prismaCommon.orgConsultationConfig.upsert({
      where: {
        id: orgConsultationConfigId
      },
      create: {
        Organization: {
          connect: {
            orgId: data.orgUid
          }
        },
        NoteTemplate: {
          connect: {
            id: data.noteTemplateId
          }
        },
      },
      update: {
        NoteTemplate: {
          connect: {
            id: data.noteTemplateId
          }
        }
      }
    });
    return {
      status: true,
      message: "Appointment settings updated successfully",
      data: orgConsultationConfig
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