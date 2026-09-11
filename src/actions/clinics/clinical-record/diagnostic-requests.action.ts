"use server";

import prisma from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@/actions/session.action";
import { DocumentTemplateType } from "@prisma/client";
import { resolveClinicTemplateId, resolveClinicEffectiveTemplate } from "@/lib/resolve-clinic-template";

export type CreateDiagnosticRequestPayload = {
  clinicUid: string;
  patientId: number;
  hpId: number;
  consultationTicketId?: number;
  remarks?: string;
  diagnosticProcedures: { diagnosticProcedureId: string; bodyPart?: string }[];
};

export const createDiagnosticRequestAction = withErrorHandling(
  async (payload: CreateDiagnosticRequestPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid: payload.clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const templateId = await resolveClinicTemplateId(prisma, clinic.id, "laboratory");

    const request = await prisma.diagnosticRequest.create({
      data: {
        clinicId: clinic.id,
        hpId: payload.hpId,
        patientId: payload.patientId,
        consultationTicketId: payload.consultationTicketId,
        documentTemplateId: templateId,
        remarks: payload.remarks,
        diagnosticProcedures: payload.diagnosticProcedures,
      },
    });

    return { message: "Diagnostic request created", data: request };
  }
);

export const getDiagnosticRequestsByConsultationAction = withErrorHandling(
  async (consultationTicketId: number) => {
    const requests = await prisma.diagnosticRequest.findMany({
      where: {
        consultationTicketId,
        isArchived: false,
      },
      include: {
        HealthCareProvider: {
          select: {
            HPProfile: { select: { title: true, name: true } },
            User: { select: { firstName: true, lastName: true } },
          }
        }
      },
      orderBy: {
        dateRequested: "desc",
      },
    });

    return { message: "Fetched requests", data: requests };
  }
);

export const getDiagnosticRequestAction = withErrorHandling(
  async (id: string) => {
    const request = await prisma.diagnosticRequest.findUnique({
      where: { id },
      include: {
        DocumentTemplate: true,
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            suffix: true,
            dob: true,
            gender: true,
            UserAddresses: {
              where: { isPrimary: true },
              select: { address: true, city: true, state: true, zipCode: true },
            },
          },
        },
        HealthCareProvider: {
          select: {
            HPProfile: { select: { title: true, name: true, suffix: true, eSignatureUrl: true } },
            User: { select: { firstName: true, lastName: true } },
            ProfessionalDetails: { select: { licenseNumber: true, ptrNumber: true } },
          },
        },
      },
    });

    if (!request) throw new Error("Request not found");

    const effectiveTemplate = await resolveClinicEffectiveTemplate(
      prisma,
      request.clinicId,
      "laboratory",
      request.DocumentTemplate
    );
    if (effectiveTemplate) {
      request.DocumentTemplate = effectiveTemplate;
    }

    return { message: "Fetched request detail", data: request };
  }
);

export const archiveDiagnosticRequestAction = withErrorHandling(
  async (id: string) => {
    await prisma.diagnosticRequest.update({
      where: { id },
      data: { isArchived: true },
    });
    return { message: "Diagnostic request archived", data: null };
  }
);
