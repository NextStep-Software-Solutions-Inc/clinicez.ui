"use server";

import prismaClient from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { MANAGEMENT_CODES } from "@/lib/philhealth-yakap/management-codes";

export const getManagementCodesAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  let codes = await prismaClient.konsultaManagementCode.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Auto-seed if table is empty
  if (codes.length === 0) {
    await prismaClient.konsultaManagementCode.createMany({
      data: [...MANAGEMENT_CODES],
      skipDuplicates: true,
    });
    codes = await prismaClient.konsultaManagementCode.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  return { data: codes, message: "Management codes fetched" };
});

export const getConsultationManagementsAction = withErrorHandling(
  async (consultationTicketId: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const entries = await prismaClient.consultationManagement.findMany({
      where: { consultationTicketId },
      include: { ManagementCode: true },
      orderBy: { createdAt: "asc" },
    });

    return { data: entries, message: "Management entries fetched" };
  }
);

export const addConsultationManagementAction = withErrorHandling(
  async (consultationTicketId: number, managementCodeId: string, remarks?: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    // Prevent duplicates (same code on same ticket)
    const existing = await prismaClient.consultationManagement.findFirst({
      where: { consultationTicketId, managementCodeId },
    });
    if (existing) {
      return { data: existing, message: "Already added" };
    }

    const entry = await prismaClient.consultationManagement.create({
      data: { consultationTicketId, managementCodeId, remarks: remarks || null },
      include: { ManagementCode: true },
    });

    return { data: entry, message: "Management added" };
  }
);

export const updateConsultationManagementRemarksAction = withErrorHandling(
  async (id: string, remarks: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const entry = await prismaClient.consultationManagement.update({
      where: { id },
      data: { remarks: remarks || null },
      include: { ManagementCode: true },
    });

    return { data: entry, message: "Remarks updated" };
  }
);

export const removeConsultationManagementAction = withErrorHandling(
  async (id: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    await prismaClient.consultationManagement.delete({ where: { id } });

    return { data: null, message: "Management removed" };
  }
);
