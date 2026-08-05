"use server";

import prisma from "@/lib/prisma";
import { Gender } from "@prisma/client";

export async function getKonsultaRecommendedService(
  ageMonths: number,
  gender: Gender | null
) {
  try {
    // Find all matching configurations
    const recommendedServices = await prisma.konsultaRecommendedService.findMany({
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
              { gender: gender || undefined }
            ]
          }
        ]
      },
    });

    if (recommendedServices.length === 0) {
      return null;
    }

    // Merge all matching diagnostic IDs and join consultation descriptions
    const allIds = Array.from(
      new Set(recommendedServices.flatMap((s) => s.philhealthDiagnosticIds))
    );
    const allDescriptions = recommendedServices
      .map((s) => s.consultationDescription)
      .filter(Boolean)
      .join(", ");

    return {
      id: recommendedServices[0].id,
      minAgeMonths: recommendedServices[0].minAgeMonths,
      maxAgeMonths: recommendedServices[0].maxAgeMonths,
      gender: recommendedServices[0].gender,
      consultationDescription: allDescriptions,
      philhealthDiagnosticIds: allIds,
    };
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
