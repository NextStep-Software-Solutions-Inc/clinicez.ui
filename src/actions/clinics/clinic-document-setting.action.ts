"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";
import { syncClinicRecordsTemplates } from "@/lib/resolve-clinic-template";

export type GetClinicDocumentDefaultTemplates = Awaited<ReturnType<typeof getClinicDocumentDefaultTemplatesAction>>;

const documentDefaultErrorHandler = (error: unknown) => {
  if (hasCodeProperty(error) && error.code === "P2021") {
    return "Document default templates are not yet configured. Please run database migrations.";
  }
};

export const getClinicDocumentDefaultTemplatesAction = withErrorHandling(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const defaults = await prismaClient.clinicDocumentDefaultTemplate.findMany({
    where: {
      Clinic: { clinicUid },
    },
    select: {
      id: true,
      documentTypeId: true,
      templateId: true,
      DocumentType: { select: { id: true, name: true, description: true } },
      Template: { select: { id: true, name: true } },
    },
  });
  return { message: "Clinic document defaults fetched.", data: defaults };
}, documentDefaultErrorHandler);

export type UpsertClinicDocumentDefaultTemplatesPayload = Array<{
  documentTypeId: number;
  templateId: number | null;
}>;

export const upsertClinicDocumentDefaultTemplatesAction = withErrorHandling(
  async (clinicUid: string, entries: UpsertClinicDocumentDefaultTemplatesPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const clinic = await prismaClient.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found.");

    await prismaClient.$transaction(
      entries.map(({ documentTypeId, templateId }) => {
        if (templateId == null) {
          return prismaClient.clinicDocumentDefaultTemplate.deleteMany({
            where: { clinicId: clinic.id, documentTypeId },
          });
        }
        return prismaClient.clinicDocumentDefaultTemplate.upsert({
          where: { clinicId_documentTypeId: { clinicId: clinic.id, documentTypeId } },
          create: { clinicId: clinic.id, documentTypeId, templateId },
          update: { templateId },
        });
      })
    );

    // If prescription template is configured, keep legacy ClinicPrescriptionSetting aligned
    const rxDocType = await prismaClient.documentTemplateType.findFirst({
      where: { name: { equals: "prescription", mode: "insensitive" } },
      select: { id: true },
    });
    if (rxDocType) {
      const rxEntry = entries.find((e) => e.documentTypeId === rxDocType.id);
      if (rxEntry) {
        if (rxEntry.templateId == null) {
          await prismaClient.clinicPrescriptionSetting.deleteMany({
            where: { clinicId: clinic.id },
          });
        } else {
          const existingRx = await prismaClient.clinicPrescriptionSetting.findFirst({
            where: { clinicId: clinic.id },
            select: { id: true },
          });
          if (existingRx) {
            await prismaClient.clinicPrescriptionSetting.update({
              where: { id: existingRx.id },
              data: { prescriptionTemplateId: rxEntry.templateId },
            });
          } else {
            await prismaClient.clinicPrescriptionSetting.create({
              data: { clinicId: clinic.id, prescriptionTemplateId: rxEntry.templateId },
            });
          }
        }
      }
    }

    // NOTE: Existing records are NOT updated. Only newly added records created after this change will receive this template.

    return { message: "Document defaults updated successfully.", data: null };
  },
  documentDefaultErrorHandler
);

export const syncClinicRecordsTemplatesAction = withErrorHandling(
  async (clinicUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    // No-op: Existing records must stay as they were originally issued
    return { message: "Existing clinic records retained without modification.", data: null };
  },
  documentDefaultErrorHandler
);


