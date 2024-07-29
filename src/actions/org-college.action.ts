"use server";

import prisma from "@lib/prisma-common";


export type GetOrgColleges = Awaited<ReturnType<typeof getOrgCollegesAction>>
export const getOrgCollegesAction = async (orgId: string) => {
  const orgCollege = await prisma.organizationCollege.findMany({
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
  return orgCollege;
}

export const createOrgCollegeAction = async (orgId: string, name: string) => {
  const orgCollege = await prisma.organizationCollege.create({
    data: {
      name,
    }
  });
  return orgCollege;
}