"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateSerialNumber } from "@/lib/utils";

export type GetLaboratoryRequestsFilters = {
  clinicUid?: string;
  patientId?: number;
  hpId?: number;
  status?: string;
  consultationTicketId?: number;
}

export type GetLaboratoryRequests = Awaited<ReturnType<typeof getLaboratoryRequestsAction>>;
export const getLaboratoryRequestsAction = withErrorHandling(async (filters: GetLaboratoryRequestsFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, status, consultationTicketId } = filters;

  const requests = await prisma.clinicLaboratoryRequest.findMany({
    where: {
      isActive: true,
      Clinic: { clinicUid },
      ...patientId ? { clinicPatientId: patientId } : {},
      ...consultationTicketId ? { consultationTicketId } : {},
      ...hpId ? { hpId } : {},
      ...status ? { status } : {},
    },
    orderBy: { createdAt: "desc" },
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

  return { message: "Successfully fetched laboratory requests", data: requests };
});

export type GetLaboratoryRequest = Awaited<ReturnType<typeof getLaboratoryRequestAction>>;
export const getLaboratoryRequestAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const request = await prisma.clinicLaboratoryRequest.findUnique({
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
      LaboratoryRequestDiagnostics: {
        include: {
          LaboratoryDiagnostic: {
            select: {
              id: true,
              name: true,
              category: true,
            }
          }
        }
      }
    },
  });

  if (!request) throw new Error("Laboratory request not found");

  return { message: "Successfully fetched laboratory request", data: request };
});

type CreateLaboratoryRequestInput = {
  clinicUid: string;
  patientId: number;
  hpId: number;
  impression?: string;
  status?: string;
  diagnosticIds: number[];
  consultationTicketId?: number;
}

export type CreateLaboratoryRequest = Awaited<ReturnType<typeof createLaboratoryRequestAction>>;
export const createLaboratoryRequestAction = withErrorHandling(async (input: CreateLaboratoryRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, impression, status, diagnosticIds, consultationTicketId } = input;
  const serialNumber = generateSerialNumber();

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true }
    });
    if (!appUser) throw new Error("Session user id is missing or invalid");
    const createdBy = appUser.id;

    // First get the clinic ID from clinicUid
    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true }
    });
    if (!clinic) throw new Error("Clinic not found");

    // Find the laboratory document template for this clinic
    const laboratoryTemplate = await prisma.documentTemplate.findFirst({
      where: {
        clinicId: clinic.id,
        isActive: true,
        DocumentTemplateType: {
          name: "laboratory"
        }
      },
      select: { id: true }
    });
    if (!laboratoryTemplate) throw new Error("Laboratory document template not found for this clinic");

    const request = await prisma.clinicLaboratoryRequest.create({
      data: {
        impression,
        serialNumber,
        status,
        clinicId: clinic.id,
        clinicPatientId: patientId,
        hpId,
        consultationTicketId: consultationTicketId || undefined,
        documentTemplateId: laboratoryTemplate.id,
        LaboratoryRequestDiagnostics: {
          create: diagnosticIds.map(diagnosticId => ({
            laboratoryDiagnosticId: diagnosticId,
          })),
        },
        isActive: true,
        createdBy,
      },
      select: {
        id: true,
        impression: true,
        status: true,
        serialNumber: true,
        isActive: true,
      }
    });

    return request;
  });

  return { message: "Successfully created laboratory request", data: result };
});

export type UpdateLaboratoryRequestInput = {
  id: number;
  clinicId?: number;
  clinicPatientId?: number;
  hpId?: number;
  documentTemplateId?: number;
  impression?: string;
  status?: string;
  isActive?: boolean;
};

export const updateLaboratoryRequestAction = withErrorHandling(async (input: UpdateLaboratoryRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { id, ...updateData } = input;
  const updatedBy = session.user.id || session.user.sub;
  const request = await prisma.clinicLaboratoryRequest.update({
    where: { id },
    data: { ...updateData, updatedBy },
    select: {
      id: true,
      impression: true,
      status: true,
      serialNumber: true,
      isActive: true,
    }
  });

  return { message: "Successfully updated laboratory request", data: request };
});

export const deleteLaboratoryRequestAction = withErrorHandling(async ({ laboratoryRequestId }: { laboratoryRequestId: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const deletedBy = session.user.id || session.user.sub;
  const request = await prisma.clinicLaboratoryRequest.update({
    where: { id: laboratoryRequestId },
    data: { deletedAt: new Date(), deletedBy, isActive: false },
    select: {
      id: true,
      impression: true,
      status: true,
      serialNumber: true,
      isActive: true,
    }
  });

  return { message: "Successfully deleted laboratory request", data: request };
});
