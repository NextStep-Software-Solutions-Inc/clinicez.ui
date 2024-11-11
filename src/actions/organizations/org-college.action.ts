"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrgColleges = Awaited<ReturnType<typeof getOrgCollegesAction>>
export const getOrgCollegesAction = async (orgUid: string) => {
  const orgCollege = await prisma.organizationCollege.findMany({
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
  return orgCollege;
}