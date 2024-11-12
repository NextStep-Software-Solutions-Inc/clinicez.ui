"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrgOffices = Awaited<ReturnType<typeof getOrgOfficesAction>>
export const getOrgOfficesAction = async (orgUid: string) => {
  const orgOffice = await prisma.organizationOffice.findMany({
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
  return orgOffice;
}