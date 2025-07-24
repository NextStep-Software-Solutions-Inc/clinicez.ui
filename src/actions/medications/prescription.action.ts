"use server";
import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";

export type GetPrescriptionsFilter = {
  clinicUid?: string,
  hpIds?: number[],
  isArchived?: boolean,
  consultationTicketId?: number,
  userId?: number,
}
export type GetPrescriptions = Awaited<ReturnType<typeof getPrescriptionsAction>>
export const getPrescriptionsAction = withErrorHandling(async (filters?: GetPrescriptionsFilter) => {
  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const { clinicUid, hpIds, isArchived, consultationTicketId, userId } = filters || {}

  const prescriptions = await prisma.prescription.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      isArchived: isArchived ?? false,
      dateArchived: isArchived ? { not: null } : null,
      Medication: { patientId: userId },
      Clinic: { clinicUid },
      ...(consultationTicketId ? { Medication: { consultationTicketId } } : {}),
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      dateArchived: true,
      isArchived: true,
      Clinic: { select: { id: true, name: true } },
      HealthcareProvider: {
        select: {
          HPProfile: { select: { title: true, name: true, suffix: true } },
          ProfessionalDetails: {
            select: {
              licenseNumber: true,
              ptrNumber: true,
            }
          }
        }
      },
      DocumentTemplate: { select: { id: true, name: true } },
      Medication: {
        select: {
          completedAt: true,
          _count: { select: { MedicationDrugs: true } },
          Patient: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true
            }
          }
        }
      }
    }
  });
  return { message: "Successfully fetched prescriptions", data: prescriptions };
})

type CreatePrescriptionPayload = {
  templateId?: number,
  medicationId: number,
  name?: string,
  hpIds: number[],
  clinicUid: string,
}
export const createPrescriptionAction = withErrorHandling(async (payload: CreatePrescriptionPayload) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")
  const { clinicUid, templateId, name, hpIds, medicationId } = payload

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    const { authorizedHpId } = validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "create prescriptions"
    );

    const template = templateId ? templateId : (await getClinicPrescriptionSetting(clinicUid))?.prescriptionTemplateId

    if (!template) throw new Error("No prescription template found")

    const prescription = await prisma.prescription.create({
      data: {
        name,
        HealthcareProvider: {
          connect: {
            id: authorizedHpId
          }
        },
        Medication: {
          connect: {
            id: medicationId
          }
        },
        DocumentTemplate: {
          connect: {
            id: template
          }
        },
        Clinic: {
          connect: {
            clinicUid
          }
        },
      }
    });

    return prescription;
  });

  return { message: "Successfully created prescription", data: result }

})

export const updatePrescriptionActions = withErrorHandling(async (payload: { id: number, name?: string, hpIds: number[] }) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")
  const { id, name, hpIds } = payload

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
      "update prescriptions"
    );

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { name }
    });

    return prescription;
  });

  return { message: "Successfully updated prescription", data: result }

})

const getClinicPrescriptionSetting = async (clinicUid: string) => {
  return await prisma.clinicPrescriptionSetting.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    }
  })
}

export type GetPrescription = Awaited<ReturnType<typeof getPrescriptionAction>>
export const getPrescriptionAction = withErrorHandling(async (id: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      DocumentTemplate: {
        select: {
          id: true,
          name: true,
          htmlContent: true
        }
      },
      Medication: {
        select: {
          HealthCareProvider: {
            select: {
              ProfessionalDetails: {
                select: {
                  licenseNumber: true,
                  ptrNumber: true,
                }
              },
              HPProfile: {
                select: {
                  title: true,
                  name: true,
                  suffix: true,
                  specialties: true,
                }
              }
            }
          },
          MedicationDrugs: {
            include: {
              Drug: true
            }
          },
          completedAt: true,
          Patient: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              dob: true,
              gender: true,
              UserAddresses: {
                distinct: ['userId'],
                take: 1,
                where: {
                  isActive: true,
                  isPrimary: true
                },
                select: {
                  address: true,
                  city: true,
                  country: true,
                  zipCode: true,
                  state: true
                }
              }
            }
          },
          _count: {
            select: {
              MedicationDrugs: true
            }
          }
        }
      }
    }
  })
  return { message: "Successfully fetched prescription", data: prescription }
})

export const archivePrescriptionAction = withErrorHandling(async (id: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  try {
    await prisma.prescription.update({
      where: { id, isArchived: false },
      data: { isArchived: true }
    })

    return { message: "Successfully archived prescription", data: undefined }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === 'P2025') throw new Error('Prescription not found');
    throw new Error('Failed to archive prescription');
  }
});