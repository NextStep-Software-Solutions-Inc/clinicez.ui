"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";

export async function getAllDiagnosticProceduresAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
            { philhealthDiagnosticId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [procedures, total] = await Promise.all([
    prisma.diagnosticProcedure.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.diagnosticProcedure.count({ where }),
  ]);

  return {
    data: procedures,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createDiagnosticProcedureAction({
  name,
  description,
  category,
  philhealthDiagnosticId,
}: {
  name: string;
  description?: string;
  category: string;
  philhealthDiagnosticId?: string;
}) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const procedure = await prisma.diagnosticProcedure.create({
    data: {
      name,
      description,
      category,
      philhealthDiagnosticId,
      isActive: true,
    },
  });

  return procedure;
}

export async function updateDiagnosticProcedureAction(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    philhealthDiagnosticId?: string;
    isActive?: boolean;
  }
) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const procedure = await prisma.diagnosticProcedure.update({
    where: { id },
    data,
  });

  return procedure;
}

export async function deleteDiagnosticProcedureAction(id: string) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const procedure = await prisma.diagnosticProcedure.delete({
    where: { id },
  });

  return procedure;
}
