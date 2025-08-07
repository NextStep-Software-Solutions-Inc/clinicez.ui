"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { Prisma } from "@prisma/client";

export type GetMedicineFilters = {
  prescriptionId?: number;
  search?: string;
  isGeneric?: boolean;
  distinct?: Prisma.MedicineScalarFieldEnum[];
};

export type GetMedicines = Awaited<ReturnType<typeof getMedicinesAction>>;
export const getMedicinesAction = withErrorHandling(async (filters: GetMedicineFilters = {}) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { prescriptionId, search, isGeneric, distinct = [] } = filters;

  const medicines = await prisma.medicine.findMany({
    ...(!!distinct?.length ? { distinct } : {}),
    orderBy: { createdAt: "desc" },
    where: {
      isActive: true,
      ...(prescriptionId ? { prescriptionId } : {}),
      ...(typeof isGeneric === 'boolean' ? { isGeneric } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { brandName: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
          { dosage: { contains: search, mode: "insensitive" } },
          { frequency: { contains: search, mode: "insensitive" } },
          { unit: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
    },
    select: {
      id: true,
      name: true,
      brandName: true,
      genericName: true,
      isGeneric: true,
      dosage: true,
      frequency: true,
      unit: true,
      duration: true,
      notes: true,
      prescriptionId: true,
      createdAt: true,
      updatedAt: true,
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
      Prescription: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          ClinicPatient: {
            select: {
              Patient: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      }
    },
  });

  return { message: "Medicines fetched successfully", data: medicines };
});

export type GetMedicine = Awaited<ReturnType<typeof getMedicineAction>>;
export const getMedicineAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: {
      Prescription: {
        include: {
          Clinic: { select: { id: true, name: true } },
          ClinicPatient: {
            select: {
              id: true,
              Patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  middleName: true,
                  suffix: true,
                  dob: true,
                  gender: true,
                  email: true,
                }
              }
            }
          },
          HealthcareProvider: {
            include: {
              HPProfile: true,
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
          }
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
    },
  });

  if (!medicine) throw new Error("Medicine not found");
  return { message: "Medicine fetched successfully", data: medicine };
});

export type CreateMedicineInput = {
  name: string;
  brandName?: string;
  genericName?: string;
  isGeneric: boolean;
  dosage?: string;
  frequency?: string;
  unit?: string;
  duration?: number;
  notes?: string;
  prescriptionId: number;
};

export const createMedicineAction = withErrorHandling(async (input: CreateMedicineInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
      }
    });

    if (!appUser) throw new Error("User not found");

    // Verify the prescription exists and is accessible
    const prescription = await prisma.prescription.findUnique({
      where: { id: input.prescriptionId },
      select: { id: true }
    });

    if (!prescription) throw new Error("Prescription not found");

    const medicine = await prisma.medicine.create({
      data: {
        ...input,
        createdById: appUser.id,
        isActive: true,
      },
    });

    return medicine;
  });

  return { message: "Medicine created successfully", data: result };
});

export type UpdateMedicineInput = {
  id: number;
  name?: string;
  brandName?: string;
  genericName?: string;
  isGeneric?: boolean;
  dosage?: string;
  frequency?: string;
  unit?: string;
  duration?: number;
  notes?: string;
  isActive?: boolean;
};

export const updateMedicineAction = withErrorHandling(async (input: UpdateMedicineInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { id, ...updateData } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
      }
    });

    if (!appUser) throw new Error("User not found");

    const medicine = await prisma.medicine.update({
      where: { id },
      data: { ...updateData, updatedBy: appUser.id },
    });

    return medicine;
  });

  return { message: "Medicine updated successfully", data: result };
});

export const deleteMedicineAction = withErrorHandling(async ({ medicineId }: { medicineId: number }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const appUser = await prisma.user.findUnique({
    where: {
      userId: session.user.sub,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    }
  });

  if (!appUser) throw new Error("User not found");

  const medicine = await prisma.medicine.update({
    where: { id: medicineId },
    data: {
      isActive: false,
      updatedBy: appUser.id,
    },
  });

  return { message: "Medicine deleted successfully", data: medicine };
});

export type CreateMultipleMedicinesInput = {
  medicines: CreateMedicineInput[];
};

export const createMultipleMedicinesAction = withErrorHandling(async (input: CreateMultipleMedicinesInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { medicines } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
      }
    });

    if (!appUser) throw new Error("User not found");

    // Verify all prescriptions exist
    const prescriptionIds = [...new Set(medicines.map(m => m.prescriptionId))];
    const prescriptions = await prisma.prescription.findMany({
      where: { id: { in: prescriptionIds } },
      select: { id: true }
    });

    if (prescriptions.length !== prescriptionIds.length) {
      throw new Error("One or more prescriptions not found");
    }

    const createdMedicines = await prisma.medicine.createMany({
      data: medicines.map(medicine => ({
        ...medicine,
        createdById: appUser.id,
        isActive: true,
      })),
    });

    return createdMedicines;
  });

  return { message: "Medicines created successfully", data: result };
});
