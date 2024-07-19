"use server";

import prisma from "@lib/prisma";

export type GetOrgOffices = Awaited<ReturnType<typeof getOrgOfficesAction>>
export const getOrgOfficesAction = async (orgId: string) => {
  const orgOffice = await prisma.organizationOffice.findMany({
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
  return orgOffice;
}