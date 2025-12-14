"use server";

import prisma from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export interface PhysicalExaminationData {
  visualAcuityLeft?: string | null;
  visualAcuityRight?: string | null;
  status?: string | null;
  caseNumber?: string | null;
}

/**
 * Get the latest physical examination for a user
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

    const physicalExam = await prisma.physicalExamination.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        visualAcuityLeft: true,
        visualAcuityRight: true,
        status: true,
        caseNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { data: physicalExam, message: "Physical examination retrieved successfully" };
  }
);

/**
 * Save or update physical examination for a user
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

    // Check if user already has a physical examination
    const existing = await prisma.physicalExamination.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.physicalExamination.update({
        where: { id: existing.id },
        data: {
          visualAcuityLeft: data.visualAcuityLeft || null,
          visualAcuityRight: data.visualAcuityRight || null,
          status: data.status || null,
        },
      });
      return { data: updated, message: "Physical examination updated successfully" };
    } else {
      // Create new record
      const created = await prisma.physicalExamination.create({
        data: {
          userId: user.id,
          visualAcuityLeft: data.visualAcuityLeft || null,
          visualAcuityRight: data.visualAcuityRight || null,
          status: data.status || null,
        },
      });
      return { data: created, message: "Physical examination created successfully" };
    }
  }
);
