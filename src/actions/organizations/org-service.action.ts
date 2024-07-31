"use server";

import prismaTenant from "@lib/prisma-tenant";


type OrgServiceFilter = {
  orgUid?: string,
  categoryId?: number
}
export type GetOrgServices = Awaited<ReturnType<typeof getOrgServicesAction>>
export const getOrgServicesAction = async (filter: OrgServiceFilter) => {
  const { orgUid, categoryId } = filter
  const orgServices = await prismaTenant.service.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      ServiceCategory: {
        isActive: true,
        orgUid,
        id: categoryId
      }
    },
    select: {
      id: true,
      name: true,
      ServiceCategory: {
        select: {
          name: true
        }
      }
    }
  });
  return orgServices;
}

