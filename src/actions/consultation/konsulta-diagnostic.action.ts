"use server";

import prismaClient from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type DiagnosticResultPayload = {
  consultationTicketId?: number | null;
  clinicPatientId: number;
  hciCaseNo: string;
  hciTransNo: string;
  resultType: string;
  resultData: Record<string, string>;
  transDate?: string;
};

export const createKonsultaDiagnosticResultAction = withErrorHandling(
  async (payload: DiagnosticResultPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    // Resolve clinicId server-side from the ClinicPatient record
    const clinicPatient = await prismaClient.clinicPatient.findUnique({
      where: { id: payload.clinicPatientId },
      select: { clinicId: true },
    });
    if (!clinicPatient) throw new Error("ClinicPatient not found");

    const result = await prismaClient.konsultaDiagnosticResult.create({
      data: {
        ...payload,
        clinicId: clinicPatient.clinicId,
      },
    });

    return { data: result, message: "Diagnostic result saved" };
  }
);

export const updateKonsultaDiagnosticResultAction = withErrorHandling(
  async (id: string, payload: Partial<DiagnosticResultPayload>) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const result = await prismaClient.konsultaDiagnosticResult.update({
      where: { id },
      data: payload,
    });

    return { data: result, message: "Diagnostic result updated" };
  }
);

export const deleteKonsultaDiagnosticResultAction = withErrorHandling(
  async (id: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    await prismaClient.konsultaDiagnosticResult.delete({ where: { id } });

    return { data: null, message: "Diagnostic result deleted" };
  }
);

export const getKonsultaDiagnosticResultsAction = withErrorHandling(
  async (opts: { consultationTicketId?: number; clinicPatientId?: number; hciCaseNo?: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const where: Record<string, unknown> = {};
    if (opts.consultationTicketId) where.consultationTicketId = opts.consultationTicketId;
    if (opts.clinicPatientId) where.clinicPatientId = opts.clinicPatientId;
    if (opts.hciCaseNo) where.hciCaseNo = opts.hciCaseNo;

    const results = await prismaClient.konsultaDiagnosticResult.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { data: results, message: "Diagnostic results fetched" };
  }
);
