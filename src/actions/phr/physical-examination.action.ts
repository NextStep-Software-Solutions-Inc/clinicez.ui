"use server";

import prisma from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export interface PhysicalExaminationData {
  visualAcuityLeft?: string | null;
  visualAcuityRight?: string | null;
}

/**
 * Get the latest visual acuity data from VitalSign for a user
 */
export const getPhysicalExaminationAction = withErrorHandling(
  async (userId: string) => {
    const session = await getCachedSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const vitalSign = await prisma.vitalSign.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        visualAcuityLeft: true,
        visualAcuityRight: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { data: vitalSign, message: "Physical examination retrieved successfully" };
  }
);

/**
 * Save or update visual acuity data on VitalSign for a user
 */
export const savePhysicalExaminationAction = withErrorHandling(
  async (userId: string, data: PhysicalExaminationData) => {
    const session = await getCachedSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has a vital sign record
    const existing = await prisma.vitalSign.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.vitalSign.update({
        where: { id: existing.id },
        data: {
          visualAcuityLeft: data.visualAcuityLeft || null,
          visualAcuityRight: data.visualAcuityRight || null,
        },
      });
      return { data: updated, message: "Physical examination updated successfully" };
    } else {
      // Create new VitalSign record with visual acuity data
      const created = await prisma.vitalSign.create({
        data: {
          userId: user.id,
          dateTaken: new Date(),
          visualAcuityLeft: data.visualAcuityLeft || null,
          visualAcuityRight: data.visualAcuityRight || null,
        },
      });
      return { data: created, message: "Physical examination created successfully" };
    }
  }
);
