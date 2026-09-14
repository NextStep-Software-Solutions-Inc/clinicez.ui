"use server";

import prismaClient from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createNotification } from "@/actions/notifications/notification.action";
import { getCachedSession } from "@/actions/session.action";
import {
  USER_WITH_HEALTHCARE_PROVIDERS_SELECT,
  validateHealthcareProviderAuth,
} from "@/lib/healthcare-provider-auth";
import { generateSerialNumber } from "@/lib/utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import { resolveClinicTemplateId } from "@/lib/resolve-clinic-template";
import prisma from "@/lib/prisma";

export type GetMedicalCertificateFilters = {
  clinicUid: string;
  patientId?: number;
  consultationTicketId?: number;
  hpIds?: number[];
  search?: string;
  distinct?: Prisma.ClinicMedicalCertificateScalarFieldEnum[];
};
export type GetMedicalCertificates = Awaited<
  ReturnType<typeof getMedicalCertificatesAction>
>;
export const getMedicalCertificatesAction = withErrorHandling(
  async (filters: GetMedicalCertificateFilters) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const {
      clinicUid,
      patientId,
      consultationTicketId,
      hpIds,
      distinct = [],
    } = filters ?? {};
    const certificates = await prisma.clinicMedicalCertificate.findMany({
      ...(distinct?.length ? { distinct } : {}),
      orderBy: { createdAt: "desc" },
      where: {
        isActive: true,
        deletedAt: null,
        Clinic: { clinicUid },
        ...(patientId ? { clinicPatientId: patientId } : {}),
        ...(consultationTicketId ? { consultationTicketId } : {}),
      },
      select: {
        id: true,
        serialNumber: true,
        createdAt: true,
        remarks: true,
        impression: true,
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
                email: true,
                dob: true,
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
                  },
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
    return {
      message: "Medical Certificates fetched successfully",
      data: certificates,
    };
  },
);

export const getMedicalCertificateAction = withErrorHandling(
  async (id: number) => {
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
                  take: 1,
                },
              },
            },
          },
        },
        Reason: true,
        Finding: true,
        Classification: true,
        DocumentTemplate: true,
        HealthCareProvider: {
          include: {
            HPProfile: true,
            ProfessionalDetails: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    if (!certificate) throw new Error("Medical Certificate not found");

    return {
      message: "Medical Certificate fetched successfully",
      data: certificate,
    };
  },
);

type CreateMedicalCertificateInput = {
  clinicUid: string;
  patientId?: number;
  documentTemplateId: number;
  hpIds: number[];
  reasonId: number;
  findingId: number;
  classificationId: number;
  remarks?: string;
  impression?: string;
  consultationTicketId: number;
};
export const createMedicalCertificateAction = withErrorHandling(
  async (input: CreateMedicalCertificateInput) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const {
      clinicUid,
      patientId,
      documentTemplateId,
      hpIds,
      reasonId,
      findingId,
      classificationId,
      remarks,
      impression,
      consultationTicketId,
    } = input;

    const serialNumber = generateSerialNumber();

    const result = await prismaClient.$transaction(async (prisma) => {
      const appUser = await prisma.user.findUnique({
        where: {
          userId: session.user.sub,
          isActive: true,
          deletedAt: null,
        },
        select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT,
      });

      const { authorizedHpId, createdBy } = validateHealthcareProviderAuth(
        appUser,
        hpIds,
        "create medical certificates",
      );

      const clinic = await prisma.clinic.findUnique({
        where: { clinicUid },
        select: { id: true },
      });
      if (!clinic) throw new Error("Clinic not found");

      let effectiveTemplateId = documentTemplateId;
      try {
        effectiveTemplateId = await resolveClinicTemplateId(prisma, clinic.id, "medical_certificate");
      } catch {
        // Fallback to provided documentTemplateId
      }

      const certificate = await prisma.clinicMedicalCertificate.create({
        data: {
          serialNumber: serialNumber,
          Clinic: { connect: { clinicUid } },
          ClinicPatient: { connect: { id: patientId } },
          DocumentTemplate: { connect: { id: effectiveTemplateId } },
          HealthCareProvider: { connect: { id: authorizedHpId } },
          Reason: { connect: { id: reasonId } },
          Finding: { connect: { id: findingId } },
          Classification: { connect: { id: classificationId } },
          CreatedBy: { connect: { id: createdBy } },
          ConsultationTicket: { connect: { id: consultationTicketId } },
          isActive: true,
          remarks: remarks || "",
          impression: impression || "",
        },
      });
      return certificate;
    });

    // Notify the patient a medical certificate was issued
    try {
      const clinicPatient = await prismaClient.clinicPatient.findUnique({
        where: { id: patientId },
        select: { patientId: true, Clinic: { select: { name: true } } },
      });
      if (clinicPatient) {
        await createNotification({
          userId: clinicPatient.patientId,
          type: "MEDICAL_CERTIFICATE_ISSUED",
          title: "Medical Certificate Issued",
          message: `A medical certificate has been issued for you at ${clinicPatient.Clinic.name}.`,
        });
      }
    } catch {
      // non-critical
    }

    return {
      message: "Medical Certificate created successfully",
      data: result,
    };
  },
);

export type UpdateMedicalCertificateInput = {
  id: number;
  clinicUid?: string;
  clinicPatientId?: number;
  documentTemplateId?: number;
  hpIds: number[];
  reasonId?: number;
  findingId?: number;
  classificationId?: number;
  remarks?: string;
  impression?: string;
  isActive?: boolean;
};
export const updateMedicalCertificateAction = withErrorHandling(
  async (input: UpdateMedicalCertificateInput) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const { id, hpIds, ...updateData } = input;

    const result = await prismaClient.$transaction(async (prisma) => {
      const appUser = await prisma.user.findUnique({
        where: {
          userId: session.user.sub,
          isActive: true,
          deletedAt: null,
        },
        select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT,
      });

      const { createdBy } = validateHealthcareProviderAuth(
        appUser,
        hpIds,
        "update medical certificates",
      );

      const certificate = await prisma.clinicMedicalCertificate.update({
        where: { id },
        data: { ...updateData, updatedBy: createdBy },
      });

      return certificate;
    });

    return {
      message: "Medical Certificate updated successfully",
      data: result,
    };
  },
);

export const deleteMedicalCertificateAction = withErrorHandling(
  async ({ medicalCertificateId }: { medicalCertificateId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const deletedBy = session.user.id;
    const certificate = await prismaClient.clinicMedicalCertificate.update({
      where: { id: medicalCertificateId },
      data: { deletedAt: new Date(), deletedBy, isActive: false },
    });
    return {
      message: "Medical Certificate deleted successfully",
      data: certificate,
    };
  },
);

export type GetMedicalCertificateReasons = Awaited<
  ReturnType<typeof getMedicalCertificateReasonsAction>
>;
export const getMedicalCertificateReasonsAction = withErrorHandling(
  async () => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const reasons = await prismaClient.medicalCertificateReason.findMany({
      where: { isActive: true },
    });
    return {
      message: "Medical Certificate Reasons fetched successfully",
      data: reasons,
    };
  },
);

/* Medical Certificate Findings */
export type GetMedicalCertificateFindings = Awaited<
  ReturnType<typeof getMedicalCertificateFindingsAction>
>;
export const getMedicalCertificateFindingsAction = withErrorHandling(
  async () => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const findings = await prismaClient.medicalCertificateFinding.findMany({
      where: { isActive: true },
    });
    return {
      message: "Medical Certificate Findings fetched successfully",
      data: findings,
    };
  },
);

/* Medical Certificate Classifications */
export type GetMedicalCertificateClassifications = Awaited<
  ReturnType<typeof getMedicalCertificateClassificationsAction>
>;
export const getMedicalCertificateClassificationsAction = withErrorHandling(
  async () => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const classifications =
      await prismaClient.medicalCertificateClassification.findMany({
        where: { isActive: true },
      });
    return {
      message: "Medical Certificate Classifications fetched successfully",
      data: classifications,
    };
  },
);
