"use server";
import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";
import { resolveClinicTemplateId } from "@/lib/resolve-clinic-template";

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
      ...(clinicUid ? { Clinic: { clinicUid } } : {}),
      ...(hpIds ? { hpId: { in: hpIds } } : {}),
      ...(userId ? { patientId: userId } : {}),
      ...(consultationTicketId ? { consultationTicketId } : {}),
      ...(isArchived !== undefined ? { isArchived } : {}),
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
      ClinicPatient: {
        select: {
          Patient: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true
            }
          }
        }
      },
      Medicines: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return { message: "Successfully fetched prescriptions", data: prescriptions };
})

type CreatePrescriptionPayload = {
  templateId?: number,
  name?: string,
  hpIds: number[],
  clinicUid: string,
  patientId: number,
  consultationTicketId: number,
}
export const createPrescriptionAction = withErrorHandling(async (payload: CreatePrescriptionPayload) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")
  const { clinicUid, templateId, name, hpIds, patientId, consultationTicketId } = payload

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

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) throw new Error("Clinic not found");

    let template = templateId;
    if (!template) {
      template = await resolveClinicTemplateId(prisma, clinic.id, "prescription");
    }

    if (!template) throw new Error("No prescription template found")

    const prescription = await prisma.prescription.create({
      data: {
        name,
        patientId,
        consultationTicketId,
        hpId: authorizedHpId,
        templateId: template,
        clinicId: clinic.id,
        createdById: appUser!.id
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
    },
    orderBy: {
      id: "desc"
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
      HealthcareProvider: {
        select: {
          HPProfile: {
            select: {
              title: true,
              name: true,
              suffix: true,
              specialties: true
            }
          },
          ProfessionalDetails: {
            select: {
              licenseNumber: true,
              ptrNumber: true
            }
          }
        }
      },
      ClinicPatient: {
        select: {
          Patient: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              dob: true,
              gender: true,
              UserAddresses: {
                where: {
                  isActive: true,
                  isPrimary: true
                },
                select: {
                  address: true,
                  city: true,
                  state: true,
                  country: true,
                  zipCode: true
                }
              }
            }
          }
        }
      },
      Medicines: {
        select: {
          id: true,
          name: true,
          brandName: true,
          genericName: true,
          dosage: true,
          frequency: true,
          duration: true,
          notes: true
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