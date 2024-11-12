"use server";

import prisma from "@lib/prisma";

type PlanFilter = {
  type: "TENANT" | "HEALTHCARE_PROVIDER";
  frequency?: "MONTHLY" | "YEARLY";
}
export type GetPlans = Awaited<ReturnType<typeof getPlansAction>>
export const getPlansAction = async (filter?: PlanFilter) => {
  try {
    const { type, frequency } = filter || {};
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        type,
        frequency
      },
      include: {
        Features: {
          select: {
            name: true,
            description: true
          }
        },
      }
    });
    return { status: true, message: "Plans fetched successfully.", data: plans }
  } catch (error) {
    console.error(`Error fetching plans: ${error}`);
    let message = "An error occurred while fetching plans.";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: []}
    
  }
};