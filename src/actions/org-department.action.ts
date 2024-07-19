"use server";

import prisma from "@lib/prisma";

export type GetOrgDepartments = Awaited<ReturnType<typeof getOrgDepartmentAction>>
export const getOrgDepartmentAction = async (orgId: string) => {
  const orgDepartment = await prisma.organizationDepartment.findMany({
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
  return orgDepartment;
}