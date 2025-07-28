"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateSerialNumber } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";

export type GetImagingStudiesFilters = {
  clinicUid?: string;
  patientId?: number;
  hpId?: number;
  consultationTicketId?: number;
}

export type GetImagingStudies = Awaited<ReturnType<typeof getImagingStudiesAction>>;
export const getImagingStudiesAction = withErrorHandling(async (filters: GetImagingStudiesFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, consultationTicketId } = filters;

  const studies = await prisma.clinicImagingRequest.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      Clinic: { clinicUid },
      ...patientId ? { clinicPatientId: patientId } : {},
      ...consultationTicketId ? { consultationTicketId } : {},
      ...hpId ? { hpId } : {},
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      serialNumber: true,
      createdAt: true,
      history: true,
      reason: true,
      impression: true,
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
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
          }
        }
      },
    },
  });

  return { message: "Successfully fetched imaging studies", data: studies };
});

export type GetImagingStudy = Awaited<ReturnType<typeof getImagingStudyAction>>;
export const getImagingStudyAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const study = await prisma.clinicImagingRequest.findUnique({
    where: { id },
    include: {
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
          }
        }
      },
      DocumentTemplate: true,
      HealthCareProvider: {
        include: {
          HPProfile: true,
          ProfessionalDetails: true,
        }
      },
      ImagingRequestDiagnostics: {
        include: {
          ImagingDiagnostic: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    },
  });

  if (!study) throw new Error("Imaging study not found");

  return { message: "Successfully fetched imaging study", data: study };
});

type CreateImagingStudyInput = {
  clinicUid: string;
  patientId: number;
  hpIds: number[];
  history?: string;
  reason?: string;
  impression?: string;
  diagnosticIds: number[];
  consultationTicketId: number;
}

export type CreateImagingStudy = Awaited<ReturnType<typeof createImagingStudyAction>>;
export const createImagingStudyAction = withErrorHandling(async (input: CreateImagingStudyInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpIds, history, reason, impression, diagnosticIds, consultationTicketId } = input;
  const serialNumber = generateSerialNumber();

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    const { authorizedHpId, createdBy } = validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "create imaging studies"
    );

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true }
    });
    if (!clinic) throw new Error("Clinic not found");

    const imagingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        isActive: true,
        DocumentTemplateType: {
          name: "imaging"
        }
      },
      select: { id: true }
    });
    if (!imagingTemplate) throw new Error("Imaging document template not found");

    const study = await prisma.clinicImagingRequest.create({
      data: {
        history,
        reason,
        impression,
        serialNumber,
        ConsultationTicket: { connect: { id: consultationTicketId } },
        Clinic: { connect: { id: clinic.id } },
        ClinicPatient: { connect: { id: patientId } },
        HealthCareProvider: { connect: { id: authorizedHpId } },
        DocumentTemplate: { connect: { id: imagingTemplate.id } },
        CreatedBy: { connect: { id: createdBy } },
        ImagingRequestDiagnostics: {
          create: diagnosticIds.map(diagnosticId => ({
            imagingDiagnosticId: diagnosticId,
          })),
        },
        isActive: true,
      },
      select: {
        id: true,
        history: true,
        reason: true,
        impression: true,
        serialNumber: true,
        isActive: true,
      }
    });

    return study;
  });

  return { message: "Successfully created imaging study", data: result };
});

export type UpdateImagingStudyInput = {
  id: number;
  clinicId?: number;
  clinicPatientId?: number;
  hpIds: number[];
  documentTemplateId?: number;
  history?: string;
  reason?: string;
  impression?: string;
  isActive?: boolean;
};

export const updateImagingStudyAction = withErrorHandling(async (input: UpdateImagingStudyInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { id, hpIds, ...updateData } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    const { createdBy } = validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "update imaging studies"
    );

    const study = await prisma.clinicImagingRequest.update({
      where: { id },
      data: { ...updateData, updatedBy: createdBy },
      select: {
        id: true,
        history: true,
        reason: true,
        impression: true,
        serialNumber: true,
        isActive: true,
      }
    });

    return study;
  });

  return { message: "Successfully updated imaging study", data: result };
});

export const deleteImagingStudyAction = withErrorHandling(async ({ imagingStudyId }: { imagingStudyId: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true }
    });
    if (!appUser) throw new Error("Session user id is missing or invalid");
    const deletedBy = appUser.id;

    const study = await prisma.clinicImagingRequest.update({
      where: { id: imagingStudyId },
      data: { deletedAt: new Date(), deletedBy, isActive: false },
      select: {
        id: true,
        history: true,
        reason: true,
        impression: true,
        serialNumber: true,
        isActive: true,
      }
    });

    return study;
  });

  return { message: "Successfully deleted imaging study", data: result };
});