"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetClinicDocumentDefaultTemplates = Awaited<ReturnType<typeof getClinicDocumentDefaultTemplatesAction>>;

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
});

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

    return { message: "Document defaults updated successfully.", data: null };
  }
);
