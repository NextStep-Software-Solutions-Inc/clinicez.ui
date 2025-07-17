"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import prisma from "@lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { Prisma } from "@prisma/client";
import { generateSerialNumber } from "@/lib/utils";

export type GetMedicalCertificateFilters = {
  clinicUid: string;
  patientId?: number;
  consultationTicketId?: number;
  hpId?: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  distinct?: Prisma.ClinicMedicalCertificateScalarFieldEnum[];
};
export type GetMedicalCertificates = Awaited<ReturnType<typeof getMedicalCertificatesAction>>;
export const getMedicalCertificatesAction = withErrorHandling(async (filters: GetMedicalCertificateFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { clinicUid, patientId, consultationTicketId, search, pageNumber = 1, pageSize = 50, distinct = [] } = filters ?? {};
  const certificates = await prisma.clinicMedicalCertificate.findMany({
    ...(pageSize ? { take: pageSize } : {}),
    ...(!!distinct?.length ? { distinct } : {}),
    skip: pageNumber ? (pageNumber - 1) * (pageSize || 10) : 0,
    orderBy: { createdAt: "desc" },
    where: {
      Clinic: { clinicUid },
      ...(patientId ? { clinicPatientId: patientId } : {}),
      ...(consultationTicketId ? { consultationTicketId } : {}),
      ...(!!search ? {
        OR: [
          { Reason: { name: { contains: search, mode: "insensitive" } } },
          { Classification: { name: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      Clinic: { select: { id: true, name: true } },
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select:
            {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              UserAddresses: {
                where: { isActive: true, isPrimary: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  address: true,
                  city: true,
                  state: true,
                  zipCode: true,
                  country: true,
                }
              },
            },
          },
        },
      },
      Reason: true,
      Finding: true,
      Classification: true,
      DocumentTemplate: true,
      HealthCareProvider: true,
    },
  });
  return { message: "Medical Certificates fetched successfully", data: certificates };
});

export type GetMedicalCertificate = Awaited<ReturnType<typeof getMedicalCertificateAction>>;
export const getMedicalCertificateAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const certificate = await prismaClient.clinicMedicalCertificate.findUnique({
    where: { id },
    include: {
      Clinic: { select: { id: true, name: true } },
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              middleName: true,
              suffix: true,
              dob: true,
              gender: true,
              email: true,
              UserAddresses: {
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        }
      },
      Reason: true,
      Finding: true,
      Classification: true,
      DocumentTemplate: true,
      HealthCareProvider: {
        include: {
          HPProfile: true,
          ProfessionalDetails: true,
        }
      },
    },
  });
  if (!certificate) throw new Error("Medical Certificate not found");
  return { message: "Medical Certificate fetched successfully", data: certificate };
});

export type CreateMedicalCertificateInput = {
  clinicUid: string;
  patientId?: number;
  documentTemplateId: number;
  hpId?: number;
  reasonId: number;
  findingId: number;
  classificationId: number;
  remarks?: string;
  consultationTicketId?: number;
};
export const createMedicalCertificateAction = withErrorHandling(async (input: CreateMedicalCertificateInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const {
    clinicUid,
    patientId,
    documentTemplateId,
    hpId,
    reasonId,
    findingId,
    classificationId,
    remarks,
    consultationTicketId } = input;

  const serialNumber = generateSerialNumber();

  const result = await prismaClient.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true }
    });
    if (!appUser) throw new Error("Session user id is missing or invalid");
    const createdBy = appUser.id;

    const certificate = await prisma.clinicMedicalCertificate.create({
      data: {
        serialNumber: serialNumber,
        Clinic: { connect: { clinicUid } },
        ClinicPatient: { connect: { id: patientId } },
        DocumentTemplate: { connect: { id: documentTemplateId } },
        HealthCareProvider: { connect: { id: hpId } },
        Reason: { connect: { id: reasonId } },
        Finding: { connect: { id: findingId } },
        Classification: { connect: { id: classificationId } },
        CreatedBy: { connect: { id: createdBy } },
        isActive: true,
        remarks: remarks || "",
        ConsultationTicket: consultationTicketId ? { connect: { id: consultationTicketId } } : undefined,
      },
    });
    return certificate;
  });
  return { message: "Medical Certificate created successfully", data: result };
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

export const deleteMedicalCertificateAction = withErrorHandling(async ({ medicalCertificateId }: { medicalCertificateId: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const deletedBy = session.user.id;
  const certificate = await prismaClient.clinicMedicalCertificate.update({
    where: { id: medicalCertificateId },
    data: { deletedAt: new Date(), deletedBy, isActive: false },
  });
  return { message: "Medical Certificate deleted successfully", data: certificate };
});

// Medical Certificate Reason
export type GetMedicalCertificateReasons = Awaited<ReturnType<typeof getMedicalCertificateReasonsAction>>;
export const getMedicalCertificateReasonsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const reasons = await prismaClient.medicalCertificateReason.findMany({
    where: { isActive: true },
  });
  return { message: "Medical Certificate Reasons fetched successfully", data: reasons };
});

/* Medical Certificate Findings */
export type GetMedicalCertificateFindings = Awaited<ReturnType<typeof getMedicalCertificateFindingsAction>>;
export const getMedicalCertificateFindingsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const findings = await prismaClient.medicalCertificateFinding.findMany({
    where: { isActive: true },
  });
  return { message: "Medical Certificate Findings fetched successfully", data: findings };
});

/* Medical Certificate Classifications */
export type GetMedicalCertificateClassifications = Awaited<ReturnType<typeof getMedicalCertificateClassificationsAction>>;
export const getMedicalCertificateClassificationsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const classifications = await prismaClient.medicalCertificateClassification.findMany({
    where: { isActive: true },
  });
  return { message: "Medical Certificate Classifications fetched successfully", data: classifications };
});

