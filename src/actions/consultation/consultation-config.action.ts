"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export type GetClinicConsultationConfig = Awaited<ReturnType<typeof getClinicConsultationConfigAction>>
export const getClinicConsultationConfigAction = async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const clinicConsultationConfig = await prisma.consultationConfig.findFirst({
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
  return clinicConsultationConfig;
}

type UpsertConsultationConfig = {
  noteTemplateId?: number;
  clinicUid: string;
}
export const upsertClinicConsultationConfigAction = async (clinicConsultationConfigId: number, data: UpsertConsultationConfig) => {
  let message = "Consultation settings updated successfully";
  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canUpdateSettings = [PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name].some(p => myPermissionArray.includes(p));
    if (!canUpdateSettings) throw new Error("You do not have permission to update consultation settings.");

    const { clinicUid, noteTemplateId } = data;
    const clinicConsultationConfig = await prisma.consultationConfig.upsert({
      where: {
        id: clinicConsultationConfigId
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
    return { status: true, message, data: clinicConsultationConfig }
  } catch (error) {
    console.error(`Error updating consultation settings: ${error}`);
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  }
}
