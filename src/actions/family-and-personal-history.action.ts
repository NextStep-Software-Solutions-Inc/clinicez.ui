"use server"

import { withErrorHandling } from "@/lib/with-error-handling";
import prisma from "@/lib/prisma";
import type {
  MedicalHistoryInput,
  MedicalHistoryBulkInput,
  FamilyMedicalHistoryInput,
  SurgicalHistoryInput,
  PersonalHistoryInput,
  ObGyneHistoryInput,
  PediatricMeasurementInput,
  ActionResponse
} from "@/types/health-history.types";
import type { Prisma } from "@prisma/client";

// Define the return type for getHealthHistoryAction based on Prisma select
type HealthHistoryResult = Prisma.UserGetPayload<{
  select: {
    id: true;
    dob: true;
    MedicalHistories: {
      include: {
        Condition: true;
      }
    };
    FamilyMedicalHistories: {
      include: {
        Condition: true;
      }
    };
    SurgicalHistories: true;
    PersonalHistory: true;
    ObGyneHistory: true;
    PhysicalExaminations: true;
    PediatricMeasurements: true;
    UserVaccinations: {
      include: {
        Vaccine: true;
        Dose: true;
      }
    };
  }
}>;

// Get comprehensive health history for a user
export const getHealthHistoryAction = withErrorHandling(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true, deletedAt: null },
    select: {
      id: true,
      dob: true,
      MedicalHistories: {
        include: {
          Condition: true, // Join with HealthCondition to get condition names
        },
        orderBy: { createdAt: 'desc' },
      },
      FamilyMedicalHistories: {
        include: {
          Condition: true,
        },
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
      SurgicalHistories: { where: { deletedAt: null }, orderBy: { operationDate: 'desc' } },
      PersonalHistory: true,
      ObGyneHistory: true,
      PhysicalExaminations: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
      PediatricMeasurements: { where: { deletedAt: null }, orderBy: { dateTaken: 'desc' }, take: 5 },
      UserVaccinations: {
        where: { isActive: true, deletedAt: null },
        include: {
          Vaccine: true,
          Dose: true,
        },
        orderBy: { dateGiven: 'desc' },
      },
    }
  });

  if (!user) throw new Error("User not found");

  return {
    status: true,
    message: "Health history fetched successfully",
    data: user
  };
});

export const updateMedicalHistoryAction = withErrorHandling(async (
  userId: string,
  bulkData: MedicalHistoryBulkInput
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  const existing = await prisma.medicalHistory.findMany({
    where: { userId: user.id },
    select: { conditionId: true },
  });

  const existingIds = existing.map(e => e.conditionId);
  const selectedIds = bulkData.conditions.map(c => c.conditionId);

  const toDelete = existingIds.filter(id => !selectedIds.includes(id));
  if (toDelete.length > 0) {
    await prisma.medicalHistory.deleteMany({
      where: {
        userId: user.id,
        conditionId: { in: toDelete },
      },
    });
  }

  const results = [];
  for (const condition of bulkData.conditions) {
    const result = await prisma.medicalHistory.upsert({
      where: {
        userId_conditionId: {
          userId: user.id,
          conditionId: condition.conditionId,
        },
      },
      create: {
        userId: user.id,
        conditionId: condition.conditionId,
        details: condition.details,
      },
      update: {
        details: condition.details,
      },
      include: {
        Condition: true,
      },
    });
    results.push(result);
  }

  return { status: true, message: "Medical history updated successfully", data: results };
});

export const addMedicalHistoryConditionAction = withErrorHandling(async (
  userId: string,
  data: MedicalHistoryInput
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  const result = await prisma.medicalHistory.create({
    data: {
      userId: user.id,
      conditionId: data.conditionId,
      details: data.details,
    },
    include: {
      Condition: true,
    },
  });

  return { status: true, message: "Medical condition added successfully", data: result };
});

export const removeMedicalHistoryConditionAction = withErrorHandling(async (
  userId: string,
  conditionId: number
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  await prisma.medicalHistory.delete({
    where: {
      userId_conditionId: {
        userId: user.id,
        conditionId: conditionId,
      },
    },
  });

  return { status: true, message: "Medical condition removed successfully", data: null };
});

// Update family medical history with new normalized structure
export const updateFamilyMedicalHistoryAction = withErrorHandling(async (
  userId: string,
  histories: Array<{ conditionId: number; details: string | null }>
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  // Get existing family medical histories
  const existing = await prisma.familyMedicalHistory.findMany({
    where: { userId: user.id },
    select: { conditionId: true },
  });

  const existingIds = existing.map(e => e.conditionId);
  const selectedIds = histories.map(h => h.conditionId);

  // Delete conditions that are no longer selected
  const toDelete = existingIds.filter(id => !selectedIds.includes(id));
  if (toDelete.length > 0) {
    await prisma.familyMedicalHistory.deleteMany({
      where: {
        userId: user.id,
        conditionId: { in: toDelete },
      },
    });
  }

  // Upsert selected conditions
  const results = [];
  for (const history of histories) {
    const result = await prisma.familyMedicalHistory.upsert({
      where: {
        userId_conditionId: {
          userId: user.id,
          conditionId: history.conditionId,
        },
      },
      create: {
        userId: user.id,
        conditionId: history.conditionId,
        details: history.details,
      },
      update: {
        details: history.details,
      },
      include: {
        Condition: true,
      },
    });
    results.push(result);
  }

  return { status: true, message: "Family medical history updated successfully", data: results };
});

export const createSurgicalHistoryAction = withErrorHandling(async (
  userId: string,
  data: SurgicalHistoryInput
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  const result = await prisma.surgicalHistory.create({
    data: { userId: user.id, ...data }
  });

  return { status: true, message: "Surgical history added successfully", data: result };
});

export const updateSurgicalHistoryAction = withErrorHandling(async (
  id: number,
  data: Partial<SurgicalHistoryInput>
) => {
  const result = await prisma.surgicalHistory.update({
    where: { id },
    data
  });

  return { status: true, message: "Surgical history updated successfully", data: result };
});

export const deleteSurgicalHistoryAction = withErrorHandling(async (id: number) => {
  await prisma.surgicalHistory.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return { status: true, message: "Surgical history deleted successfully", data: null };
});

export const upsertPersonalHistoryAction = withErrorHandling(async (
  userId: string,
  data: Partial<PersonalHistoryInput>
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  const result = await prisma.personalHistory.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data
  });

  return { status: true, message: "Personal history updated successfully", data: result };
});

export const upsertObGyneHistoryAction = withErrorHandling(async (
  userId: string,
  data: Partial<ObGyneHistoryInput>
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  const result = await prisma.obGyneHistory.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data
  });

  return { status: true, message: "OB-Gyne history updated successfully", data: result };
});

export const createPediatricMeasurementAction = withErrorHandling(async (
  userId: string,
  data: PediatricMeasurementInput
) => {
  const user = await prisma.user.findUnique({
    where: { userId, isActive: true },
    select: { id: true }
  });

  if (!user) throw new Error("User not found");

  const result = await prisma.pediatricMeasurement.create({
    data: { userId: user.id, ...data }
  });

  return { status: true, message: "Pediatric measurement added successfully", data: result };
});

export const updatePediatricMeasurementAction = withErrorHandling(async (
  id: number,
  data: Partial<PediatricMeasurementInput>
) => {
  const result = await prisma.pediatricMeasurement.update({
    where: { id },
    data
  });

  return { status: true, message: "Pediatric measurement updated successfully", data: result };
});

export const deletePediatricMeasurementAction = withErrorHandling(async (id: number) => {
  await prisma.pediatricMeasurement.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return { status: true, message: "Pediatric measurement deleted successfully", data: null };
});
