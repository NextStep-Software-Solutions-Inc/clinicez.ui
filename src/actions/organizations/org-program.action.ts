"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrgPrograms = Awaited<ReturnType<typeof getOrgProgramsAction>>
export const getOrgProgramsAction = async (orgUid: string) => {
  const orgProgram = await prisma.organizationProgram.findMany({
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
  return orgProgram;
}