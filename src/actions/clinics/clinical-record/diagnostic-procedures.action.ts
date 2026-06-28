"use server";

import prisma from "@/lib/prisma";

export async function getDiagnosticProcedures(category?: string) {
  try {
    const procedures = await prisma.diagnosticProcedure.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: {
        name: "asc",
      },
    });

    return { data: procedures };
  } catch (error) {
    console.error("Failed to fetch diagnostic procedures:", error);
    return { error: "Failed to fetch diagnostic procedures" };
  }
}
