"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateSerialNumber } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";

export type GetLaboratoryRequestsFilters = {
  clinicUid?: string;
  patientId?: number;
  hpId?: number;
  consultationTicketId?: number;
}

export type GetLaboratoryRequests = Awaited<ReturnType<typeof getLaboratoryRequestsAction>>;
export const getLaboratoryRequestsAction = withErrorHandling(async (filters: GetLaboratoryRequestsFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, consultationTicketId } = filters;

  const requests = await prisma.clinicLaboratoryRequest.findMany({
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
      impression: true,
      _count: {
        select: {
          LaboratoryRequestProcedures: true,
        }
      },
      createdAt: true,
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
      LaboratoryRequestProcedures: {
        include: {
          LaboratoryProcedure: {
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
      LaboratoryRequestProcedures: {
        include: {
          LaboratoryProcedure: {
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
  hpIds: number[];
  impression?: string;
  diagnosticIds: number[];
  consultationTicketId: number;
}

export type CreateLaboratoryRequest = Awaited<ReturnType<typeof createLaboratoryRequestAction>>;
export const createLaboratoryRequestAction = withErrorHandling(async (input: CreateLaboratoryRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpIds, impression, diagnosticIds, consultationTicketId } = input;
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
      "create laboratory requests"
    );

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true }
    });
    if (!clinic) throw new Error("Clinic not found");

    const laboratoryTemplate = await prisma.documentTemplate.findFirst({
      where: {
        isActive: true,
        DocumentTemplateType: {
          name: "laboratory"
        }
      },
      select: { id: true }
    });
    if (!laboratoryTemplate) throw new Error("Laboratory document template not found");

    const request = await prisma.clinicLaboratoryRequest.create({
      data: {
        impression,
        serialNumber,
        Clinic: { connect: { id: clinic.id } },
        ClinicPatient: { connect: { id: patientId } },
        HealthCareProvider: { connect: { id: authorizedHpId } },
        ConsultationTicket: { connect: { id: consultationTicketId } },
        DocumentTemplate: { connect: { id: laboratoryTemplate.id } },
        CreatedBy: { connect: { id: createdBy } },
        LaboratoryRequestProcedures: {
          create: diagnosticIds.map(diagnosticId => ({
            clinicLaboratoryProcedureId: diagnosticId,
          })),
        },
        isActive: true,
      },
      select: {
        id: true,
        impression: true,
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
  hpIds: number[];
  documentTemplateId?: number;
  impression?: string;
  diagnosticIds?: number[];
  isActive?: boolean;
};

export const updateLaboratoryRequestAction = withErrorHandling(async (input: UpdateLaboratoryRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { id, diagnosticIds, hpIds, ...updateData } = input;

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
      "update laboratory requests"
    );

    const request = await prisma.clinicLaboratoryRequest.update({
      where: { id },
      data: { ...updateData, updatedBy: createdBy },
      select: {
        id: true,
        impression: true,
        serialNumber: true,
        isActive: true,
      }
    });

    if (diagnosticIds !== undefined) {
      await prisma.clinicLaboratoryRequestProcedure.deleteMany({
        where: { clinicLaboratoryRequestId: id }
      });

      if (diagnosticIds.length > 0) {
        await prisma.clinicLaboratoryRequestProcedure.createMany({
          data: diagnosticIds.map(diagnosticId => ({
            clinicLaboratoryRequestId: id,
            clinicLaboratoryProcedureId: diagnosticId,
          }))
        });
      }
    }

    return request;
  });

  return { message: "Successfully updated laboratory request", data: result };
});

export const deleteLaboratoryRequestAction = withErrorHandling(async ({ laboratoryRequestId }: { laboratoryRequestId: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true }
    });
    if (!appUser) throw new Error("Session user id is missing or invalid");
    const deletedBy = appUser.id;

    const request = await prisma.clinicLaboratoryRequest.update({
      where: { id: laboratoryRequestId },
      data: { deletedAt: new Date(), deletedBy, isActive: false },
      select: {
        id: true,
        impression: true,
        serialNumber: true,
        isActive: true,
      }
    });

    return request;
  });

  return { message: "Successfully deleted laboratory request", data: result };
});
