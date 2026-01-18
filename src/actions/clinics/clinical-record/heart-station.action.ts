"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateSerialNumber } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";

export type GetHeartStationRequestsFilters = {
  clinicUid?: string;
  patientId?: number;
  hpId?: number;
  consultationTicketId?: number;
}

export type GetHeartStationRequests = Awaited<ReturnType<typeof getHeartStationRequestsAction>>;
export const getHeartStationRequestsAction = withErrorHandling(async (filters: GetHeartStationRequestsFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpId, consultationTicketId } = filters;

  const requests = await prisma.clinicHeartStationRequest.findMany({
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
      HeartStationRequestProcedures: {
        include: {
          HeartStationProcedure: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
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

  return { message: "Successfully fetched heart station requests", data: requests };
});

export type GetHeartStationRequest = Awaited<ReturnType<typeof getHeartStationRequestAction>>;
export const getHeartStationRequestAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const request = await prisma.clinicHeartStationRequest.findUnique({
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
      HeartStationRequestProcedures: {
        include: {
          HeartStationProcedure: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!request) throw new Error("Heart station request not found");

  return { message: "Successfully fetched heart station request", data: request };
});

type CreateHeartStationRequestInput = {
  clinicUid: string;
  patientId: number;
  hpIds: number[];
  history?: string;
  reason?: string;
  impression?: string;
  procedureIds: number[];
  consultationTicketId: number;
}

export type CreateHeartStationRequest = Awaited<ReturnType<typeof createHeartStationRequestAction>>;
export const createHeartStationRequestAction = withErrorHandling(async (input: CreateHeartStationRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpIds, history, reason, impression, procedureIds, consultationTicketId } = input;
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
      "create heart station requests"
    );

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true }
    });
    if (!clinic) throw new Error("Clinic not found");

    const heartStationTemplate = await prisma.documentTemplate.findFirst({
      where: {
        isActive: true,
        DocumentTemplateType: {
          name: "heart_station"
        }
      },
      select: { id: true }
    });
    if (!heartStationTemplate) throw new Error("Heart station document template not found");

    const request = await prisma.clinicHeartStationRequest.create({
      data: {
        history,
        reason,
        impression,
        serialNumber,
        ConsultationTicket: { connect: { id: consultationTicketId } },
        Clinic: { connect: { id: clinic.id } },
        ClinicPatient: { connect: { id: patientId } },
        HealthCareProvider: { connect: { id: authorizedHpId } },
        DocumentTemplate: { connect: { id: heartStationTemplate.id } },
        CreatedBy: { connect: { id: createdBy } },
        HeartStationRequestProcedures: {
          create: procedureIds.map(procedureId => ({
            clinicHeartStationProcedureId: procedureId,
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

    return request;
  });

  return { message: "Successfully created heart station request", data: result };
});

export type UpdateHeartStationRequestInput = {
  id: number;
  clinicId?: number;
  clinicPatientId?: number;
  hpIds: number[];
  documentTemplateId?: number;
  history?: string;
  reason?: string;
  impression?: string;
  procedureIds?: number[];
  isActive?: boolean;
};

export const updateHeartStationRequestAction = withErrorHandling(async (input: UpdateHeartStationRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { id, hpIds, history, reason, impression, procedureIds, isActive } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "update heart station requests"
    );

    const request = await prisma.clinicHeartStationRequest.update({
      where: { id },
      data: {
        ...history !== undefined && { history },
        ...reason !== undefined && { reason },
        ...impression !== undefined && { impression },
        ...isActive !== undefined && { isActive },
        ...appUser && { updatedBy: appUser.id },
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

    // Update procedures if provided
    if (procedureIds !== undefined) {
      // Delete existing procedures
      await prisma.clinicHeartStationRequestProcedure.deleteMany({
        where: { clinicHeartStationRequestId: id }
      });

      // Create new procedures
      if (procedureIds.length > 0) {
        await prisma.clinicHeartStationRequestProcedure.createMany({
          data: procedureIds.map(procedureId => ({
            clinicHeartStationRequestId: id,
            clinicHeartStationProcedureId: procedureId,
          }))
        });
      }
    }

    return request;
  });

  return { message: "Successfully updated heart station request", data: result };
});

export type DeleteHeartStationRequestInput = {
  id: number;
  hpIds: number[];
};

export const deleteHeartStationRequestAction = withErrorHandling(async (input: DeleteHeartStationRequestInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { id, hpIds } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "delete heart station requests"
    );

    const request = await prisma.clinicHeartStationRequest.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        ...appUser && { deletedBy: appUser.id },
      }
    });

    return request;
  });

  return { message: "Successfully deleted heart station request", data: result };
});
