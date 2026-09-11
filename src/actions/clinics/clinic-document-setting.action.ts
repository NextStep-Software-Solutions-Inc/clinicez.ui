"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";

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

import { syncClinicRecordsTemplates } from "@/lib/resolve-clinic-template";

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

    // Synchronize all existing records to point to newly selected templates
    await syncClinicRecordsTemplates(prismaClient, clinic.id);

    return { message: "Document defaults updated successfully.", data: null };
  },
  documentDefaultErrorHandler
);

export const syncClinicRecordsTemplatesAction = withErrorHandling(
  async (clinicUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const clinic = await prismaClient.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found.");

    await syncClinicRecordsTemplates(prismaClient, clinic.id);
    return { message: "Clinic records synchronized with default templates.", data: null };
  },
  documentDefaultErrorHandler
);

