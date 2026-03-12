"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetClinicDocumentSetting = Awaited<ReturnType<typeof getClinicDocumentSettingAction>>;

export const getClinicDocumentSettingAction = withErrorHandling(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const setting = await prismaClient.clinicDocumentSetting.findFirst({
    where: {
      Clinic: { clinicUid },
    },
    include: {
      MedCertTemplate: {
        select: { id: true, name: true, DocumentTemplateType: { select: { id: true, name: true } } },
      },
      LabTemplate: {
        select: { id: true, name: true, DocumentTemplateType: { select: { id: true, name: true } } },
      },
      ImagingTemplate: {
        select: { id: true, name: true, DocumentTemplateType: { select: { id: true, name: true } } },
      },
      HeartStationTemplate: {
        select: { id: true, name: true, DocumentTemplateType: { select: { id: true, name: true } } },
      },
    },
  });
  return { message: "Clinic document setting fetched.", data: setting };
});

export type UpsertClinicDocumentSettingPayload = {
  clinicUid: string;
  medCertTemplateId?: number | null;
  labTemplateId?: number | null;
  imagingTemplateId?: number | null;
  heartStationTemplateId?: number | null;
};

export const upsertClinicDocumentSettingAction = withErrorHandling(
  async (payload: UpsertClinicDocumentSettingPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const { clinicUid, medCertTemplateId, labTemplateId, imagingTemplateId, heartStationTemplateId } = payload;

    const clinic = await prismaClient.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found.");

    const buildRelation = (id: number | null | undefined) =>
      id != null ? { connect: { id } } : { disconnect: true };

    const setting = await prismaClient.clinicDocumentSetting.upsert({
      where: { clinicId: clinic.id },
      create: {
        Clinic: { connect: { id: clinic.id } },
        ...(medCertTemplateId != null ? { MedCertTemplate: { connect: { id: medCertTemplateId } } } : {}),
        ...(labTemplateId != null ? { LabTemplate: { connect: { id: labTemplateId } } } : {}),
        ...(imagingTemplateId != null ? { ImagingTemplate: { connect: { id: imagingTemplateId } } } : {}),
        ...(heartStationTemplateId != null
          ? { HeartStationTemplate: { connect: { id: heartStationTemplateId } } }
          : {}),
      },
      update: {
        MedCertTemplate: buildRelation(medCertTemplateId),
        LabTemplate: buildRelation(labTemplateId),
        ImagingTemplate: buildRelation(imagingTemplateId),
        HeartStationTemplate: buildRelation(heartStationTemplateId),
      },
    });
    return { message: "Document settings updated successfully.", data: setting };
  }
);
