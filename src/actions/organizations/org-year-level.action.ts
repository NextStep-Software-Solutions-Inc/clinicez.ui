"use server";

import prisma from "@lib/prisma-common";


export type GetOrgYearLevels = Awaited<ReturnType<typeof getOrgYearLevelsAction>>
export const getOrgYearLevelsAction = async (orgId: string) => {
  const yearLevels = await prisma.orgYearLevel.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      Organization: {
        orgId
      }
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    }
  });
  return yearLevels;
}