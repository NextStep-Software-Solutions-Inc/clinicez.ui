"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrganizationYearLevels = Awaited<ReturnType<typeof getOrganizationYearLevelsAction>>
export const getOrganizationYearLevelsAction = async (orgUid: string) => {
  const yearLevels = await prisma.organizationYearLevel.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      Organization: {
        orgUid
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