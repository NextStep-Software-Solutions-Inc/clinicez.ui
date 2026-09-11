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
    orderBy: {
      id: "desc"
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

  const clinic = await prismaClient.clinic.findUnique({
    where: { clinicUid },
    select: { id: true },
  });
  if (!clinic) throw new Error("Clinic not found.");

  let clinicPrescriptionConfig;
  if (clinicPrescriptionConfigId > 0) {
    clinicPrescriptionConfig = await prismaClient.clinicPrescriptionSetting.upsert({
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
  } else {
    const existing = await prismaClient.clinicPrescriptionSetting.findFirst({
      where: { clinicId: clinic.id },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    if (existing) {
      clinicPrescriptionConfig = await prismaClient.clinicPrescriptionSetting.update({
        where: { id: existing.id },
        data: {
          prescriptionTemplateId: prescriptionTemplateId!,
        },
      });
    } else {
      clinicPrescriptionConfig = await prismaClient.clinicPrescriptionSetting.create({
        data: {
          clinicId: clinic.id,
          prescriptionTemplateId: prescriptionTemplateId!,
        },
      });
    }
  }

  // Also synchronize ClinicDocumentDefaultTemplate for prescription so both settings stay identical
  if (prescriptionTemplateId) {
    const rxDocType = await prismaClient.documentTemplateType.findFirst({
      where: { name: { in: ["prescription"], mode: "insensitive" } },
      select: { id: true },
    });
    if (rxDocType) {
      await prismaClient.clinicDocumentDefaultTemplate.upsert({
        where: { clinicId_documentTypeId: { clinicId: clinic.id, documentTypeId: rxDocType.id } },
        create: { clinicId: clinic.id, documentTypeId: rxDocType.id, templateId: prescriptionTemplateId },
        update: { templateId: prescriptionTemplateId },
      });
    }
  }

  // NOTE: Existing records are NOT updated. Only newly added records created after this change will receive this template.

  return { message: "Prescription settings updated successfully", data: clinicPrescriptionConfig};
})
