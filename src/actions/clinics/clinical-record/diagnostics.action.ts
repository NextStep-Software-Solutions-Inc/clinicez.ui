"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetImagingDiagnostics = Awaited<ReturnType<typeof getImagingDiagnosticsAction>>;
export const getImagingDiagnosticsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const diagnostics = await prisma.imagingDiagnostic.findMany({
    orderBy: { name: "asc" },
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      isActive: true,
    },
  });

  return { message: "Imaging diagnostics fetched successfully", data: diagnostics };
});

export type GetLaboratoryDiagnostics = Awaited<ReturnType<typeof getLaboratoryDiagnosticsAction>>;
export const getLaboratoryDiagnosticsAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const diagnostics = await prisma.laboratoryDiagnostic.findMany({
    orderBy: { name: "asc" },
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      isActive: true,
    },
  });

  return { message: "Laboratory diagnostics fetched successfully", data: diagnostics };
});