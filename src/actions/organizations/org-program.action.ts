"use server";

import prisma from "@lib/prisma-common";

export type GetOrgPrograms = Awaited<ReturnType<typeof getOrgProgramsAction>>
export const getOrgProgramsAction = async (orgId: string) => {
  const orgProgram = await prisma.organizationProgram.findMany({
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
  return orgProgram;
}