"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrgDepartments = Awaited<ReturnType<typeof getOrgDepartmentAction>>
export const getOrgDepartmentAction = async (orgUid: string) => {
  const orgDepartment = await prisma.organizationDepartment.findMany({
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
  return orgDepartment;
}