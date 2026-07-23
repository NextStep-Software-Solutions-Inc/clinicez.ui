"use server"

import prisma from "@lib/prisma";

import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { normalizeOptional, hasCodeProperty } from "@/lib/utils";

export type GetPhilHealthRecordAction = Awaited<ReturnType<typeof getPhilHealthRecordAction>>;
export const getPhilHealthRecordAction = withErrorHandling(async (userUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const record = await prisma.philHealthRecord.findFirst({
    where: { User: { userId: userUid } }
  });

  if (!record) throw new Error("PhilHealth record not found");

  return {
    message: "PhilHealth record retrieved successfully",
    data: record
  };
});

type CreatePhilHealthRecordPayload = {
  userUid: string; // maps to User.userId unique string
  philhealth: {
    pin: string;
    philSysId?: string | null;
    tin?: string | null;
    memberType?: string;
  };
};

export const createPhilHealthRecordAction = withErrorHandling(async ({ userUid, philhealth }: CreatePhilHealthRecordPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  let record;
  try {
    record = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { userId: userUid }, select: { id: true } });
      if (!user) throw new Error("User not found");
      // Ensure only one PhilHealth record per user (business rule)
      const existing = await tx.philHealthRecord.findFirst({ where: { userId: user.id, deletedAt: null } });
      if (existing) {
        throw new Error("A PhilHealth record already exists for this user. Please update the existing record instead.");
      }
      return tx.philHealthRecord.create({
        data: {
          userId: user.id,
          pin: philhealth.pin,
          philSysId: normalizeOptional(philhealth.philSysId),
          tin: normalizeOptional(philhealth.tin),
          memberType: philhealth.memberType || 'MM',
        }
      });
    });
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2002") {
      throw new Error("PIN already exists. Please use a different PhilHealth PIN.");
    }
    throw error;
  }

  return {
    message: "PhilHealth record created successfully",
    data: record
  };
});

type UpdatePhilHealthRecordPayload = {
  philHealthRecordId: number;
  philhealth: {
    pin: string;
    philSysId?: string | null;
    tin?: string | null;
    memberType?: string;
  };
};

export const updatePhilHealthRecordAction = withErrorHandling(async ({ philHealthRecordId, philhealth }: UpdatePhilHealthRecordPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  let record;
  try {
    record = await prisma.philHealthRecord.update({
      where: { id: philHealthRecordId },
      data: {
        pin: philhealth.pin,
        philSysId: normalizeOptional(philhealth.philSysId),
        tin: normalizeOptional(philhealth.tin),
        memberType: philhealth.memberType || 'MM',
      }
    });
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2002") {
      throw new Error("PIN already exists. Please use a different PhilHealth PIN.");
    }
    throw error;
  }

  return {
    message: "PhilHealth record updated successfully",
    data: record
  };
});

export const deletePhilHealthRecordAction = async (philHealthRecordId: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.philHealthRecord.update({
      where: { id: philHealthRecordId },
      data: { isActive: false, deletedAt: new Date() }
    })
    return { status: true, message: "PhilHealth record deleted successfully" };
  } catch (error) {
    console.error("Error deleting PhilHealth record:", error);
    let message = "Failed to delete PhilHealth record";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }

};

// Dedicated photo update action (so UI can upload photo separately without touching other fields)
export const updatePhilHealthRecordPhotoAction = withErrorHandling(async ({ philHealthRecordId, photoUrl }: { philHealthRecordId: number; photoUrl: string }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  // Use a parameterized raw update to avoid transient client type drift, then fetch the updated record
  await prisma.$executeRaw`UPDATE "PhilHealthRecord" SET "photoUrl" = ${photoUrl} WHERE "id" = ${philHealthRecordId}`;
  const record = await prisma.philHealthRecord.findUnique({ where: { id: philHealthRecordId } });
  return { message: "PhilHealth record photo updated successfully", data: record };
});