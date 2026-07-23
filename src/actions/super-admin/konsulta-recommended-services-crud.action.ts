"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { Gender } from "@prisma/client";

export async function getAllKonsultaRecommendedServicesAction({
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const where = {
    ...(search
      ? {
          OR: [
            { consultationDescription: { contains: search, mode: "insensitive" as const } },
            // Could add array search if supported by prisma for strings, but description is main text
          ],
        }
      : {}),
  };

  const [services, total] = await Promise.all([
    prisma.konsultaRecommendedService.findMany({
      where,
      orderBy: [{ minAgeMonths: "asc" }, { maxAgeMonths: "asc" }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.konsultaRecommendedService.count({ where }),
  ]);

  return {
    data: services,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createKonsultaRecommendedServiceAction({
  minAgeMonths,
  maxAgeMonths,
  gender,
  consultationDescription,
  philhealthDiagnosticIds,
}: {
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
  gender?: Gender | null;
  consultationDescription: string;
  philhealthDiagnosticIds: string[];
}) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const service = await prisma.konsultaRecommendedService.create({
    data: {
      minAgeMonths,
      maxAgeMonths,
      gender,
      consultationDescription,
      philhealthDiagnosticIds,
    },
  });

  return service;
}

export async function updateKonsultaRecommendedServiceAction(
  id: string,
  data: {
    minAgeMonths?: number | null;
    maxAgeMonths?: number | null;
    gender?: Gender | null;
    consultationDescription?: string;
    philhealthDiagnosticIds?: string[];
  }
) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const service = await prisma.konsultaRecommendedService.update({
    where: { id },
    data,
  });

  return service;
}

export async function deleteKonsultaRecommendedServiceAction(id: string) {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const service = await prisma.konsultaRecommendedService.delete({
    where: { id },
  });

  return service;
}
