"use server";

import prisma from "@lib/prisma";
import { cache } from 'react';
import { withErrorHandling } from "@/lib/with-error-handling";
import { withRetry } from "@/lib/database-health";
import { findUserSafely } from "@/lib/user-sync";
import { Prisma } from "@prisma/client";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

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

  // Permission check: allow self-recording or require WRITE:CLINIC:VITAL_SIGNS
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const isOwn = session.user.sub === userId;
  if (!isOwn) {
    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionSet = new Set(myPermissions.map(p => p.name));
    const writeVitalsPermission = PERMISSIONS.CLINIC["WRITE:CLINIC:VITAL_SIGNS"].name;
    const superAdminPermission = PERMISSIONS.USER["SUPER_ADMIN"].name;
    if (!myPermissionSet.has(writeVitalsPermission) && !myPermissionSet.has(superAdminPermission)) {
      throw new Error(`You do not have permission to record vital signs for this patient. Required permission: ${writeVitalsPermission}`);
    }
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
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

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
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  return await prisma.vitalSign.findUnique({
    where: {
      isActive: true,
      id: vitalsId
    }
  });
})

export const updateUserVitalSignAction = async (vitalsId: number, payload: BaseVitalSign) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  // Verify the vital sign exists and belongs to the user
  const vitalSign = await prisma.vitalSign.findUnique({
    where: { isActive: true, id: vitalsId },
    select: { User: { select: { userId: true } } }
  });
  if (!vitalSign) throw new Error("Vital sign not found.");

  if (vitalSign.User.userId !== session.user.sub) {
    throw new Error("You do not have permission to update this vital sign.");
  }

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
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  // Verify the vital sign exists and belongs to the user OR user has delete permission
  const vitalSign = await prisma.vitalSign.findUnique({
    where: { isActive: true, id: vitalsId },
    select: { User: { select: { userId: true } } }
  });
  if (!vitalSign) throw new Error("Vital sign not found.");

  // Only the owner can delete their own vital signs
  if (vitalSign.User.userId !== session.user.sub) {
    throw new Error("You do not have permission to delete this vital sign.");
  }

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