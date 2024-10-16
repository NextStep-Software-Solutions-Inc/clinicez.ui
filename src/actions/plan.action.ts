"use server";

import prisma from "@lib/prisma-common";

type PlanFilter = {
  type: "TENANT" | "HEALTHCARE_PROVIDER";
  frequency?: "MONTHLY" | "YEARLY";
}
export type GetPlans = Awaited<ReturnType<typeof getPlansAction>>
export const getPlansAction = async (filter?: PlanFilter) => {
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
  return plans;
};