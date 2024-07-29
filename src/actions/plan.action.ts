"use server";

import prisma from "@lib/prisma-common";

export const getPlansAction = async () => {
  const plans = await prisma.plan.findMany({
    where: {
      isActive: true
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