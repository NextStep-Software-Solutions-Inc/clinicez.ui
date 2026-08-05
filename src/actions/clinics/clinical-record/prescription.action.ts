"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { USER_WITH_HEALTHCARE_PROVIDERS_SELECT, validateHealthcareProviderAuth } from "@/lib/healthcare-provider-auth";
import { generateSerialNumber } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { createNotification } from "@/actions/notifications/notification.action";
import { getNextSequenceNumber } from "@/lib/sequence-generator";
import { formatKonsultaHciNumber } from "@/lib/format-sequence";

export type GetPrescriptionFilters = {
  clinicUid: string;
  patientId?: number;
  consultationTicketId?: number;
  hpIds?: number[];
  search?: string;
  distinct?: Prisma.PrescriptionScalarFieldEnum[];
};

export type GetPrescriptions = Awaited<ReturnType<typeof getPrescriptionsAction>>;
export const getPrescriptionsAction = withErrorHandling(async (filters: GetPrescriptionFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, consultationTicketId, hpIds, search, distinct = [] } = filters ?? {};

  const prescriptions = await prisma.prescription.findMany({
    ...(!!distinct?.length ? { distinct } : {}),
    orderBy: { createdAt: "desc" },
    where: {
      isActive: true,
      isArchived: false,
      Clinic: { clinicUid },
      ...(patientId ? { patientId } : {}),
      ...(consultationTicketId ? { consultationTicketId } : {}),
      ...(hpIds?.length ? { hpId: { in: hpIds } } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { serialNumber: { contains: search, mode: "insensitive" } },
          { remarks: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
    },
    select: {
      id: true,
      serialNumber: true,
      name: true,
      remarks: true,
      isArchived: true,
      dateArchived: true,
      createdAt: true,
      updatedAt: true,
      Clinic: { select: { id: true, name: true } },
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
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
                }
              },
            },
          },
        },
      },
      DocumentTemplate: true,
      HealthcareProvider: {
        select: {
          id: true,
          User: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          HPProfile: {
            select: {
              title: true,
              name: true,
            }
          }
        }
      },
      ConsultationTicket: {
        select: {
          id: true,
          subject: true,
        }
      },
      Medicines: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          brandName: true,
          genericName: true,
          isGeneric: true,
          dosage: true,
          qty: true,
          frequency: true,
          unit: true,
          duration: true,
          notes: true,
        }
      },
    },
  });

  return { message: "Prescriptions fetched successfully", data: prescriptions };
});

export type GetPrescription = Awaited<ReturnType<typeof getPrescriptionAction>>;
export const getPrescriptionAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      Clinic: { select: { id: true, name: true } },
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
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        }
      },
      DocumentTemplate: true,
      HealthcareProvider: {
        include: {
          HPProfile: true,
          ProfessionalDetails: true,
          User: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      ConsultationTicket: {
        select: {
          id: true,
          subject: true,
        }
      },
      CreatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      },
      UpdatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      },
      Medicines: {
        where: { isActive: true },
        include: {
          CreatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          UpdatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      },
    },
  });

  if (!prescription) throw new Error("Prescription not found");
  return { message: "Prescription fetched successfully", data: prescription };
});

export type CreatePrescriptionInput = {
  name?: string;
  remarks?: string;
  consultationTicketId: number;
  isArchived?: boolean;
  patientId: number;
  clinicUid: string;
  hpIds: number[];
};

export const createPrescriptionAction = withErrorHandling(async (input: CreatePrescriptionInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { name, remarks, consultationTicketId, isArchived = false, patientId, clinicUid, hpIds } = input;

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
      "create prescriptions"
    );

    // Resolve prescription document template with fallback:
    // 1) Clinic prescription setting
    const prescriptionSetting = await prisma.clinicPrescriptionSetting.findFirst({
      where: {
        Clinic: { clinicUid },
        PrescriptionTemplate: { isActive: true, deletedAt: null }
      },
      select: { PrescriptionTemplate: true }
    });

    let documentTemplate = prescriptionSetting?.PrescriptionTemplate ?? null;

    // 2) Active prescription template belonging to this clinic
    if (!documentTemplate) {
      documentTemplate = await prisma.documentTemplate.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
          Clinic: { clinicUid },
          DocumentTemplateType: {
            name: { equals: "prescription", mode: "insensitive" }
          }
        }
      });
    }

    // 3) Any active system-wide prescription template
    if (!documentTemplate) {
      documentTemplate = await prisma.documentTemplate.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
          DocumentTemplateType: {
            name: { equals: "prescription", mode: "insensitive" }
          }
        }
      });
    }

    // 4) Auto-create default template if none exists in the database
    if (!documentTemplate) {
      let docType = await prisma.documentTemplateType.findFirst({
        where: { name: { equals: "prescription", mode: "insensitive" } }
      });

      if (!docType) {
        docType = await prisma.documentTemplateType.create({
          data: {
            name: "prescription",
            description: "Prescription document template"
          }
        });
      }

      const clinicObj = await prisma.clinic.findUnique({
        where: { clinicUid },
        select: { id: true }
      });

      if (!clinicObj) throw new Error("Clinic not found");

      documentTemplate = await prisma.documentTemplate.create({
        data: {
          clinicId: clinicObj.id,
          name: "Default Prescription Template",
          type: docType.id,
          isActive: true,
          htmlContent: "",
        }
      });
    }

    const clinic = await prisma.clinic.findUniqueOrThrow({
      where: { clinicUid },
      select: {
        id: true,
        ClinicSetting: { select: { philhealthAccreditationNumber: true } },
      }
    });
    const serialNumber = generateSerialNumber();
    const hciAccreNo = clinic.ClinicSetting?.philhealthAccreditationNumber ?? null;
    const transactionSequence = hciAccreNo
      ? await getNextSequenceNumber("KONSULTA_MEDICINE_TRANSACTION", clinic.id)
      : null;

    const prescription = await prisma.prescription.create({
      data: {
        serialNumber,
        ...(hciAccreNo && transactionSequence ? {
          transactionNumber: formatKonsultaHciNumber("M", hciAccreNo, transactionSequence),
          transactionGeneratedAt: new Date(),
        } : {}),
        name: name || "",
        remarks: remarks || "",
        consultationTicketId,
        isArchived,
        templateId: documentTemplate.id,
        patientId,
        hpId: authorizedHpId,
        clinicId: clinic.id,
        createdById: createdBy,
        isActive: true,
      },
    });

    return prescription;
  });

  // Notify the patient a prescription was issued
  try {
    const clinicPatient = await prisma.clinicPatient.findUnique({
      where: { id: patientId },
      select: { patientId: true, Clinic: { select: { name: true } } },
    });
    if (clinicPatient) {
      await createNotification({
        userId: clinicPatient.patientId,
        type: "PRESCRIPTION_ISSUED",
        title: "Prescription Issued",
        message: `A prescription has been issued for you at ${clinicPatient.Clinic.name}.`,
      });
    }
  } catch {
    // non-critical
  }

  return { message: "Prescription created successfully", data: result };
});

export type UpdatePrescriptionInput = {
  id: number;
  name?: string;
  remarks?: string;
  consultationTicketId?: number;
  isArchived?: boolean;
  templateId?: number;
  patientId?: number;
  hpIds: number[];
  isActive?: boolean;
};

export const updatePrescriptionAction = withErrorHandling(async (input: UpdatePrescriptionInput) => {
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
      "update prescriptions"
    );

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { ...updateData, updatedBy: createdBy },
    });

    return prescription;
  });

  return { message: "Prescription updated successfully", data: result };
});

export const deletePrescriptionAction = withErrorHandling(async ({ prescriptionId }: { prescriptionId: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const appUser = await prisma.user.findUnique({
    where: {
      userId: session.user.sub,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true }
  });
  if (!appUser) throw new Error("User not found");
  const prescription = await prisma.prescription.update({
    where: { id: prescriptionId },
    data: {
      isActive: false,
      updatedBy: appUser.id,
    },
  });

  return { message: "Prescription deleted successfully", data: prescription };
});