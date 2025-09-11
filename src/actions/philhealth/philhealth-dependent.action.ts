"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { Gender } from "@prisma/client";

export interface PhilHealthDependentDTO {
  id: number;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  relationship?: string | null;
  dob?: Date | null;
  gender?: Gender | null;
}

const findRecordIdByUserUid = async (userUid: string): Promise<number | null> => {
  const record = await prisma.philHealthRecord.findFirst({
    where: { User: { userId: userUid }, isActive: true },
    select: { id: true }
  });
  return record?.id ?? null;
};

export const getPhilHealthDependentsAction = withErrorHandling(async (userUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const recordId = await findRecordIdByUserUid(userUid);
  if (!recordId) return { message: "No PhilHealth record", data: [] as PhilHealthDependentDTO[] };
  const dependents = await prisma.philHealthDependent.findMany({
    where: { philHealthRecordId: recordId, deletedAt: null },
    orderBy: { createdAt: "asc" }
  });
  return { message: "Dependents retrieved", data: dependents };
});

export interface CreatePhilHealthDependentPayload {
  userUid: string;
  dependent: {
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    relationship?: string | null;
    dob?: string | null; // ISO date
    gender?: Gender | null;
  };
}

export const createPhilHealthDependentAction = withErrorHandling(async ({ userUid, dependent }: CreatePhilHealthDependentPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const recordId = await findRecordIdByUserUid(userUid);
  if (!recordId) return { message: "Philhealth record not found", data: undefined };
  const created = await prisma.philHealthDependent.create({
    data: {
      philHealthRecordId: recordId,
      firstName: dependent.firstName,
      middleName: dependent.middleName || null,
      lastName: dependent.lastName || null,
      suffix: dependent.suffix || null,
      relationship: dependent.relationship || null,
      dob: dependent.dob ? new Date(dependent.dob) : null,
      gender: dependent.gender ?? null,
    }
  });
  return { message: "Dependent created", data: created };
});

export interface UpdatePhilHealthDependentPayload {
  userUid: string;
  dependentId: number;
  dependent: {
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    relationship?: string | null;
    dob?: string | null; // ISO date
    gender?: Gender | null;
  };
}

export const updatePhilHealthDependentAction = withErrorHandling(async ({ userUid, dependentId, dependent }: UpdatePhilHealthDependentPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const recordId = await findRecordIdByUserUid(userUid);
  if (!recordId) return { message: "Philhealth record not found", data: undefined };
  const existing = await prisma.philHealthDependent.findUnique({ where: { id: dependentId } });
  if (!existing || existing.philHealthRecordId !== recordId) throw new Error("Dependent not found");
  const updated = await prisma.philHealthDependent.update({
    where: { id: dependentId },
    data: {
      firstName: dependent.firstName,
      middleName: dependent.middleName || null,
      lastName: dependent.lastName || null,
      suffix: dependent.suffix || null,
      relationship: dependent.relationship || null,
      dob: dependent.dob ? new Date(dependent.dob) : null,
      gender: dependent.gender ?? null,
    }
  });
  return { message: "Dependent updated", data: updated };
});

export interface DeletePhilHealthDependentPayload {
  userUid: string;
  dependentId: number;
}

export const deletePhilHealthDependentAction = withErrorHandling(async ({ userUid, dependentId }: DeletePhilHealthDependentPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");
  const recordId = await findRecordIdByUserUid(userUid);
  if (!recordId) return { message: "Philhealth record not found", data: undefined };
  const existing = await prisma.philHealthDependent.findUnique({ where: { id: dependentId } });
  if (!existing || existing.philHealthRecordId !== recordId) throw new Error("Dependent not found");
  const deleted = await prisma.philHealthDependent.update({
    where: { id: dependentId },
    data: { deletedAt: new Date() }
  });
  return { message: "Dependent deleted", data: deleted };
});
