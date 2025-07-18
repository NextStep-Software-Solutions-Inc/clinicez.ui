"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateSerialNumber } from "@/lib/utils";

export type GetImagingStudiesFilters = {
  clinicUid?: string;
  patientId?: number;
  hpId?: number;
  status?: string;
  consultationTicketId?: number;
}

export type GetImagingStudies = Awaited<ReturnType<typeof getImagingStudiesAction>>;
export const getImagingStudiesAction = withErrorHandling(async (filters: GetImagingStudiesFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, status, consultationTicketId } = filters;

  const studies = await prisma.clinicImagingRequest.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      Clinic: { clinicUid },
      ...patientId ? { clinicPatientId: patientId } : {},
      ...consultationTicketId ? { consultationTicketId } : {},
      ...hpId ? { hpId } : {},
      ...status ? { status } : {},
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      serialNumber: true,
      createdAt: true,
      status: true,
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
      }
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
  hpId: number;
  history?: string;
  reason?: string;
  impression?: string;
  status?: string;
  diagnosticIds: number[];
  consultationTicketId?: number;
}

export type CreateImagingStudy = Awaited<ReturnType<typeof createImagingStudyAction>>;
export const createImagingStudyAction = withErrorHandling(async (input: CreateImagingStudyInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, history, reason, impression, status, diagnosticIds, consultationTicketId } = input;
  const serialNumber = generateSerialNumber();

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true }
    });
    if (!appUser) throw new Error("Session user id is missing or invalid");
    const createdBy = appUser.id;

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
        status,
        consultationTicketId: consultationTicketId || undefined,
        clinicId: clinic.id,
        clinicPatientId: patientId,
        hpId,
        documentTemplateId: imagingTemplate.id,
        ImagingRequestDiagnostics: {
          create: diagnosticIds.map(diagnosticId => ({
            imagingDiagnosticId: diagnosticId,
          })),
        },
        isActive: true,
        createdBy,
      },
      select: {
        id: true,
        history: true,
        reason: true,
        impression: true,
        status: true,
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
  hpId?: number;
  documentTemplateId?: number;
  history?: string;
  reason?: string;
  impression?: string;
  status?: string;
  isActive?: boolean;
};

export const updateImagingStudyAction = withErrorHandling(async (input: UpdateImagingStudyInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { id, ...updateData } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true }
    });
    if (!appUser) throw new Error("Session user id is missing or invalid");
    const updatedBy = appUser.id;

    const study = await prisma.clinicImagingRequest.update({
      where: { id },
      data: { ...updateData, updatedBy },
      select: {
        id: true,
        history: true,
        reason: true,
        impression: true,
        status: true,
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
        status: true,
        serialNumber: true,
        isActive: true,
      }
    });

    return study;
  });

  return { message: "Successfully deleted imaging study", data: result };
});