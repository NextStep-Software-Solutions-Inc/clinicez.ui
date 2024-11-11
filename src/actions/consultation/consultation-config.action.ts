"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetOrgConsultationConfig = Awaited<ReturnType<typeof getOrgConsultationConfigAction>>
export const getOrgConsultationConfigAction = async (clinicUid: string) => {
  
  const orgConsultationConfig = await prisma.consultationConfig.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    },
    include: {
      NoteTemplate: {
        include: {
          NoteSections: true
        }
      }

    }
  });
  return orgConsultationConfig;
}

type UpsertConsultationConfig = {
  noteTemplateId?: number;
  clinicUid: string;
}
export const upsertOrgConsultationConfigAction = async (orgConsultationConfigId: number, data: UpsertConsultationConfig) => {
  let message = "Appointment settings updated successfully";
  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const { clinicUid, noteTemplateId } = data;
    const orgConsultationConfig = await prisma.consultationConfig.upsert({
      where: {
        id: orgConsultationConfigId
      },
      create: {
        Clinic: {
          connect: {
            clinicUid
          }
        },
        NoteTemplate: {
          connect: {
            id: noteTemplateId
          }
        },
      },
      update: {
        NoteTemplate: {
          connect: {
            id: noteTemplateId
          }
        }
      }
    });
    return { status: true, message, data: orgConsultationConfig}
  } catch (error) {
    console.error(`Error updating appointment settings: ${error}`);
    if(error instanceof Error) message = error.message;
    return { status: false, message: "Failed to update appointment settings", data: null}
  }
}
