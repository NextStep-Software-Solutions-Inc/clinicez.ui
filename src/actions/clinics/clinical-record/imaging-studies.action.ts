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
import { resolveClinicTemplateId, resolveClinicEffectiveTemplate } from "@/lib/resolve-clinic-template";

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
    throw new Error("You do not have permission to view imaging studies");
  }

  // Check if user has any nurse healthcare provider role
  const userHps = await getHPsAction({ userId: session.user.sub });
  const isNurse = (userHps ?? []).some((hp: NonNullable<GetHPsType>[number]) => {
    const hpTypeName = hp.HPType?.name?.toLowerCase().trim() ?? "";
    return hpTypeName.includes("nurse");
  });

  const studies = await prisma.clinicImagingRequest.findMany({
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
      ImagingRequestProcedures: {
        include: {
          ImagingProcedure: {
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
      ImagingRequestProcedures: {
        select: {
          bodyPart: true,
          notes: true,
          ImagingProcedure: {
            select: {
              id: true,
              name: true,
              description: true,
              MasterProcedure: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!study) throw new Error("Imaging study not found");

  if (!study.DocumentTemplate) {
    const fallbackTemplate = await resolveClinicEffectiveTemplate(
      prisma,
      study.clinicId,
      "imaging",
      null
    );
    if (fallbackTemplate) {
      study.DocumentTemplate = fallbackTemplate;
    }
  }

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
  procedureDetails?: { id: number; bodyPart?: string; notes?: string }[];
  consultationTicketId: number;
}

export type CreateImagingStudy = Awaited<ReturnType<typeof createImagingStudyAction>>;
export const createImagingStudyAction = withErrorHandling(async (input: CreateImagingStudyInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, hpIds, history, reason, impression, diagnosticIds, procedureDetails, consultationTicketId } = input;
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

    const templateId = await resolveClinicTemplateId(prisma, clinic.id, "imaging");

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
        DocumentTemplate: { connect: { id: templateId } },
        CreatedBy: { connect: { id: createdBy } },
        ImagingRequestProcedures: {
          create: diagnosticIds.map(diagnosticId => {
            const detail = procedureDetails?.find(d => d.id === diagnosticId);
            return {
              clinicImagingProcedureId: diagnosticId,
              bodyPart: detail?.bodyPart || undefined,
              notes: detail?.notes || undefined,
            };
          }),
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

  // Notify the patient an imaging request was issued
  try {
    const clinicPatient = await prisma.clinicPatient.findUnique({
      where: { id: patientId },
      select: { patientId: true, Clinic: { select: { name: true } } },
    });
    if (clinicPatient) {
      await createNotification({
        userId: clinicPatient.patientId,
        type: "DIAGNOSTIC_ISSUED",
        title: "Imaging Request Issued",
        message: `An imaging request has been issued for you at ${clinicPatient.Clinic.name}.`,
      });
    }
  } catch {
    // non-critical
  }

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
  diagnosticIds?: number[];
  isActive?: boolean;
};

export const updateImagingStudyAction = withErrorHandling(async (input: UpdateImagingStudyInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const { id, hpIds, diagnosticIds, ...updateData } = input;

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

    // Update the main imaging study
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

    // Update diagnostics if provided
    if (diagnosticIds !== undefined) {
      // Delete existing diagnostics
      await prisma.clinicImagingRequestProcedure.deleteMany({
        where: { clinicImagingRequestId: id }
      });

      // Create new diagnostics
      if (diagnosticIds.length > 0) {
        await prisma.clinicImagingRequestProcedure.createMany({
          data: diagnosticIds.map(diagnosticId => ({
            clinicImagingRequestId: id,
            clinicImagingProcedureId: diagnosticId,
          }))
        });
      }
    }

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
