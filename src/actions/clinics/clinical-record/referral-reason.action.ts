"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetReferralReasons = Awaited<ReturnType<typeof getReferralReasonsAction>>;
export const getReferralReasonsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const reasons = await prisma.referralReason.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
    },
  });

  return { message: "Referral reasons fetched successfully", data: reasons };
});

type CreateReferralReasonInput = {
  name: string;
  description?: string;
};

export const createReferralReasonAction = withErrorHandling(async (input: CreateReferralReasonInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { name, description } = input;

  const existingReason = await prisma.referralReason.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });

  if (existingReason) {
    throw new Error("Referral reason with this name already exists");
  }

  const reason = await prisma.referralReason.create({
    data: {
      name,
      description: description || null,
      isActive: true,
    },
  });

  return { message: "Referral reason created successfully", data: reason };
});

type UpdateReferralReasonInput = {
  id: number;
  name?: string;
  description?: string;
  isActive?: boolean;
};

export const updateReferralReasonAction = withErrorHandling(async (input: UpdateReferralReasonInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { id, name, description, isActive } = input;

  const existingReason = await prisma.referralReason.findUnique({
    where: { id }
  });

  if (!existingReason) {
    throw new Error("Referral reason not found");
  }

  if (name && name !== existingReason.name) {
    const nameExists = await prisma.referralReason.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        id: { not: id }
      }
    });

    if (nameExists) {
      throw new Error("Referral reason with this name already exists");
    }
  }

  const reason = await prisma.referralReason.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return { message: "Referral reason updated successfully", data: reason };
});

export const deleteReferralReasonAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const existingReason = await prisma.referralReason.findUnique({
    where: { id }
  });

  if (!existingReason) {
    throw new Error("Referral reason not found");
  }

  // Check if the reason is being used in any referral slips
  const usageCount = await prisma.clinicReferralSlip.count({
    where: { reasonId: id, isActive: true }
  });

  if (usageCount > 0) {
    throw new Error("Cannot delete referral reason as it is being used in referral slips");
  }

  const reason = await prisma.referralReason.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: "Referral reason deleted successfully", data: reason };
});
