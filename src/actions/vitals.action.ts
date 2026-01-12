"use server";

import prisma from "@lib/prisma";
import { cache } from 'react';
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { findUserSafely } from "@/lib/user-sync";
import { Prisma } from "@prisma/client";

const calculateBMI = (weight: number, height: number) => {
  return weight / Math.pow(height / 100, 2);

}

type BaseVitalSign = {
  dateTaken: Date;
  temp?: number;
  pulseRate?: number;
  respRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  notes?: string;
}
export const createUserVitalSignAction = withErrorHandling(async (payload: BaseVitalSign & { userId: string }) => {
  const { userId, ...res } = payload;

  // Validate input
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Use retry mechanism to handle database conflicts
  const result = await withRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      // Find the user safely, handling migration scenarios
      const currentUser = await findUserSafely(userId);

      if (!currentUser) {
        throw new Error(`User with ID ${userId} not found or inactive`);
      }

      return await tx.vitalSign.create({
        data: {
          userId: currentUser.id,
          ...res,
          ...(res.height && res.weight ? { bmi: calculateBMI(res.weight, res.height) } : {}),
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 10000
    });
  }, 3, 200);

  return { message: "Vital signs created successfully", data: result };
}, async (error) => {
  console.error("createUserVitalSignAction error:", error);
  throw error;
});


export type GetUserVitalSigns = Awaited<ReturnType<typeof getUserVitalSignsAction>>;
export const getUserVitalSignsAction = cache(async (unique: string) => {
  return await prisma.vitalSign.findMany({
    orderBy: {
      createdAt: "asc"
    },
    where: {
      isActive: true,
      User: {
        OR: [
          { userId: unique },
          { email: unique }]
      }
    }
  });
})

export const getUserVitalSignAction = cache(async (vitalsId: number) => {
  return await prisma.vitalSign.findUnique({
    where: {
      isActive: true,
      id: vitalsId
    }
  });
})

export const updateUserVitalSignAction = async (vitalsId: number, payload: BaseVitalSign) => {
  return await prisma.vitalSign.update({
    where: {
      isActive: true,
      id: vitalsId
    },
    data: {
      ...payload,
      ...(payload.height && payload.weight ? { bmi: calculateBMI(payload.weight, payload.height) } : {}),
    }
  });
}

export const deleteUserVitalSignAction = async (vitalsId: number) => {
  return await prisma.vitalSign.update({
    where: {
      isActive: true,
      id: vitalsId
    },
    data: {
      isActive: false
    }
  });
}