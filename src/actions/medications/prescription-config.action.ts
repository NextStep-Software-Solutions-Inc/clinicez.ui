"use server";

import "server-only";
import prismaClient from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetClinicPrescriptionConfig = Awaited<ReturnType<typeof getClinicPrescriptionConfigAction>>
export const getClinicPrescriptionConfigAction = withErrorHandling(async (clinicUid: string) => {
  
  const clinicPrescriptionConfig = await prismaClient.clinicPrescriptionSetting.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    },
    include: {
      PrescriptionTemplate: {
        include: {
          DocumentTemplateType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });
  return {message: "Clinic Prescription setting fetched.", data:clinicPrescriptionConfig};
})

type UpsertPrescriptionConfig = {
  prescriptionTemplateId?: number;
  clinicUid: string;
}
export const upsertClinicPrescriptionConfigAction = withErrorHandling(async (clinicPrescriptionConfigId: number, data: UpsertPrescriptionConfig) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");
  
  const { clinicUid, prescriptionTemplateId } = data;
  const clinicPrescriptionConfig = await prismaClient.clinicPrescriptionSetting.upsert({
    where: {
      id: clinicPrescriptionConfigId
    },
    create: {
      Clinic: {
        connect: {
          clinicUid
        }
      },
      PrescriptionTemplate: {
        connect: {
          id: prescriptionTemplateId
        }
      },
    },
    update: {
      PrescriptionTemplate: {
        connect: {
          id: prescriptionTemplateId
        }
      }
    }
  });
  return { message: "Prescription settings updated successfully", data: clinicPrescriptionConfig}
})
