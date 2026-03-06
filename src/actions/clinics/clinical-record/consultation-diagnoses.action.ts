"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetConsultationDiagnoses = Awaited<
  ReturnType<typeof getConsultationDiagnosesAction>
>;
export const getConsultationDiagnosesAction = withErrorHandling(
  async ({ consultationTicketId }: { consultationTicketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const diagnoses = await prisma.consultationDiagnosis.findMany({
      where: { consultationTicketId },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        icd10Code: true,
        description: true,
        type: true,
        hpId: true,
        createdAt: true,
        HealthCareProvider: {
          select: {
            HPProfile: { select: { title: true, name: true } },
            User: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return { message: "Diagnoses fetched", data: diagnoses };
  }
);

export type AddConsultationDiagnosis = Awaited<
  ReturnType<typeof addConsultationDiagnosisAction>
>;
export const addConsultationDiagnosisAction = withErrorHandling(
  async ({
    consultationTicketId,
    icd10Code,
    description,
    type = "PRIMARY",
    hpId,
  }: {
    consultationTicketId: number;
    icd10Code: string;
    description: string;
    type?: string;
    hpId: number;
  }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const diagnosis = await prisma.consultationDiagnosis.create({
      data: {
        consultationTicketId,
        icd10Code: icd10Code.trim().toUpperCase(),
        description: description.trim(),
        type,
        hpId,
      },
      select: {
        id: true,
        icd10Code: true,
        description: true,
        type: true,
        hpId: true,
        createdAt: true,
        HealthCareProvider: {
          select: {
            HPProfile: { select: { title: true, name: true } },
            User: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return { message: "Diagnosis added", data: diagnosis };
  }
);

export type UpdateConsultationDiagnosis = Awaited<
  ReturnType<typeof updateConsultationDiagnosisAction>
>;
export const updateConsultationDiagnosisAction = withErrorHandling(
  async ({
    id,
    icd10Code,
    description,
    type,
  }: {
    id: number;
    icd10Code?: string;
    description?: string;
    type?: string;
  }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const diagnosis = await prisma.consultationDiagnosis.update({
      where: { id },
      data: {
        ...(icd10Code !== undefined
          ? { icd10Code: icd10Code.trim().toUpperCase() }
          : {}),
        ...(description !== undefined
          ? { description: description.trim() }
          : {}),
        ...(type !== undefined ? { type } : {}),
      },
      select: {
        id: true,
        icd10Code: true,
        description: true,
        type: true,
        hpId: true,
        createdAt: true,
        HealthCareProvider: {
          select: {
            HPProfile: { select: { title: true, name: true } },
            User: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return { message: "Diagnosis updated", data: diagnosis };
  }
);

export type DeleteConsultationDiagnosis = Awaited<
  ReturnType<typeof deleteConsultationDiagnosisAction>
>;
export const deleteConsultationDiagnosisAction = withErrorHandling(
  async ({ id }: { id: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.consultationDiagnosis.delete({ where: { id } });

    return { message: "Diagnosis deleted", data: { id } };
  }
);
