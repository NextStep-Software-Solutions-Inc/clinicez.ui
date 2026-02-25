"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateSerialNumber } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";
import { getPermissionsAction } from "@/actions/permission.action";
import { PERMISSIONS } from "@/lib/permissions";
import { getHPsAction, GetHPsType } from "@/actions/hp.actions";
import { createNotification } from "@/actions/notifications/notification.action";

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

  // Check permissions
  const [permissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ]);

  const userPermissionArray = permissions.map(p => p.name);
  const readAllConsultationsPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:ALL"].name];
  const readOwnConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:OWN"].name];
  const readCreatedConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:CREATED"].name];
  const readCoCreatedConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name];

  const canReadAllConsultations = readAllConsultationsPermissions.every(p => userPermissionArray.includes(p));
  const canReadOwnConsultations = readOwnConsultationPermissions.every(p => userPermissionArray.includes(p));
  const canReadCreatedConsultations = readCreatedConsultationPermissions.every(p => userPermissionArray.includes(p));
  const canReadCoCreatedConsultations = readCoCreatedConsultationPermissions.every(p => userPermissionArray.includes(p));

  if (!canReadAllConsultations && !canReadOwnConsultations && !canReadCreatedConsultations && !canReadCoCreatedConsultations) {
    throw new Error("You do not have permission to view heart station requests");
  }

  // Check if user has any nurse healthcare provider role
  const userHps = await getHPsAction({ userId: session.user.sub });
  const isNurse = (userHps ?? []).some((hp: NonNullable<GetHPsType>[number]) => {
    const hpTypeName = hp.HPType?.name?.toLowerCase().trim() ?? "";
    return hpTypeName.includes("nurse");
  });

  const requests = await prisma.clinicHeartStationRequest.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      Clinic: { clinicUid },
      ...patientId ? { clinicPatientId: patientId } : {},
      ...consultationTicketId ? { consultationTicketId } : {},
      ...hpId ? { hpId } : {},
      // Permission-based filtering - only add conditions for granted permissions
      OR: [
        ...(canReadAllConsultations ? [{ Clinic: { clinicUid } }] : []),
        ...(canReadCreatedConsultations ? [{
          ConsultationTicket: {
            ConsultationTicketHPs: {
              some: {
                HealthCareProvider: {
                  User: {
                    userId: session.user.sub
                  }
                }
              }
            }
          }
        }] : []),
        ...(canReadOwnConsultations ? [{
          ConsultationTicket: {
            Appointment: {
              Requesters: {
                some: {
                  User: {
                    userId: session.user.sub
                  }
                }
              }
            }
          }
        }] : []),
        ...(canReadCoCreatedConsultations ? [{
          ConsultationTicket: {
            Appointment: {
              AppointmentRouting: {
                some: {
                  status: "ACCEPTED",
                  RoutedTo: {
                    User: {
                      userId: session.user.sub
                    }
                  }
                }
              }
            }
          }
        }] : []),
        // Allow nurses who are assigned to the appointment
        ...(isNurse ? [{
          ConsultationTicket: {
            Appointment: {
              AppointmentRouting: {
                some: {
                  status: "ACCEPTED",
                  RoutedTo: {
                    User: {
                      userId: session.user.sub
                    },
                    HPType: {
                      name: {
                        contains: "nurse",
                        mode: "insensitive" as const
                      }
                    }
                  }
                }
              }
            }
          }
        }] : [])
      ]
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

  // Notify the patient a heart station request was issued
  try {
    const clinicPatient = await prisma.clinicPatient.findUnique({
      where: { id: patientId },
      select: { patientId: true, Clinic: { select: { name: true } } },
    });
    if (clinicPatient) {
      await createNotification({
        userId: clinicPatient.patientId,
        type: "DIAGNOSTIC_ISSUED",
        title: "Heart Station Request Issued",
        message: `A heart station request has been issued for you at ${clinicPatient.Clinic.name}.`,
      });
    }
  } catch {
    // non-critical
  }

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
