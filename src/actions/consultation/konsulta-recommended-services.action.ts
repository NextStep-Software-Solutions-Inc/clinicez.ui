"use server";

import prisma from "@/lib/prisma";
import { Gender } from "@prisma/client";

export async function getKonsultaRecommendedService(
  ageMonths: number,
  gender: Gender | null
) {
  try {
    // Find the matching configuration
    // We check where minAgeMonths <= ageMonths and (maxAgeMonths >= ageMonths or maxAgeMonths is null)
    // And gender matches or is null
    const recommendedService = await prisma.konsultaRecommendedService.findFirst({
      where: {
        AND: [
          {
            OR: [
              { minAgeMonths: null },
              { minAgeMonths: { lte: ageMonths } }
            ]
          },
          {
            OR: [
              { maxAgeMonths: null },
              { maxAgeMonths: { gte: ageMonths } }
            ]
          },
          {
            OR: [
              { gender: null },
              { gender: gender }
            ]
          }
        ]
      },
    });

    return recommendedService;
  } catch (error) {
    console.error("Failed to fetch Yakap recommended service:", error);
    return null;
  }
}

export async function updateKonsultaDiagnosticOptionsAction(
  consultationTicketId: number,
  options: { philhealthDiagnosticId: string; status: 'RQ' | 'RF' | 'XX' }[]
) {
  try {
    await prisma.consultationTicket.update({
      where: { id: consultationTicketId },
      data: {
        konsultaRecommendedDiagnosticOptions: options,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update Yakap diagnostic options:", error);
    return { success: false, error: "Failed to save options." };
  }
}
