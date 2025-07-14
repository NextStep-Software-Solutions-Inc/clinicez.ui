"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";
import prisma from "@lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { Prisma } from "@prisma/client";

export type GetMedicalCertificateFilters = {
  clinicUid: string;
  patientId?: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  distinct?: Prisma.ClinicMedicalCertificateScalarFieldEnum[];
};
export type GetMedicalCertificates = Awaited<ReturnType<typeof getMedicalCertificatesAction>>;
export const getMedicalCertificatesAction = withErrorHandling(async (filters: GetMedicalCertificateFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { clinicUid, patientId, search, pageNumber = 1, pageSize = 50, distinct = [] } = filters ?? {};

  const certificates = await prisma.clinicMedicalCertificate.findMany({
    ...(pageSize ? { take: pageSize } : {}),
    ...(!!distinct?.length ? { distinct } : {}),
    skip: pageNumber ? (pageNumber - 1) * (pageSize || 10) : 0,
    orderBy: { createdAt: "desc" },
    where: {
      Clinic: { clinicUid },
      ...(patientId ? { clinicPatientId: patientId } : {}),
      ...(!!search ? {
        OR: [
          { Reason: { name: { contains: search, mode: "insensitive" } } },
          { Classification: { name: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      Clinic: { select: { id: true, name: true } },
      ClinicPatient: { select: { id: true, Patient: { select: { id: true, userId: true, firstName: true, lastName: true, email: true } } } },
      Reason: true,
      Finding: true,
      Classification: true,
      DocumentTemplate: true,
      HealthCareProvider: true,
      CreatedBy: true,
      UpdatedBy: true,
      DeletedBy: true,
    },
  });
  return { message: "Medical Certificates fetched successfully", data: certificates };
});

export type AddMedicalCertificateInput = {
  clinicUid: string;
  clinicPatientId: number;
  documentTemplateId: number;
  hpId: number;
  reasonId: number;
  findingId: number;
  classificationId: number;
};
export const addMedicalCertificateAction = withErrorHandling(async (input: AddMedicalCertificateInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { clinicUid, clinicPatientId, documentTemplateId, hpId, reasonId, findingId, classificationId } = input;
  const createdBy = session.user.id;
  const certificate = await prismaClient.clinicMedicalCertificate.create({
    data: {
      Clinic: { connect: { clinicUid } },
      ClinicPatient: { connect: { id: clinicPatientId } },
      DocumentTemplate: { connect: { id: documentTemplateId } },
      HealthCareProvider: { connect: { id: hpId } },
      Reason: { connect: { id: reasonId } },
      Finding: { connect: { id: findingId } },
      Classification: { connect: { id: classificationId } },
      CreatedBy: { connect: { id: createdBy } },
    },
  });
  return { message: "Medical Certificate created successfully", data: certificate };
});

export type UpdateMedicalCertificateInput = {
  id: number;
  clinicUid?: string;
  clinicPatientId?: number;
  documentTemplateId?: number;
  hpId?: number;
  reasonId?: number;
  findingId?: number;
  classificationId?: number;
  isActive?: boolean;
};
export const updateMedicalCertificateAction = withErrorHandling(async (input: UpdateMedicalCertificateInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { id, ...updateData } = input;
  const updatedBy = session.user.id;
  const certificate = await prismaClient.clinicMedicalCertificate.update({
    where: { id },
    data: { ...updateData, updatedBy },
  });
  return { message: "Medical Certificate updated successfully", data: certificate };
});

export const deleteMedicalCertificateAction = withErrorHandling(async ({ id }: { id: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const deletedBy = session.user.id;
  const certificate = await prismaClient.clinicMedicalCertificate.update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy, isActive: false },
  });
  return { message: "Medical Certificate deleted successfully", data: certificate };
});