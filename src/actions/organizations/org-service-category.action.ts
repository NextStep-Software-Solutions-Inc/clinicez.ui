"use server";

import prismaTenant from "@lib/prisma-tenant";

export type GetOrgServiceCategories = Awaited<ReturnType<typeof getOrgServiceCategoriesAction>>
export const getOrgServiceCategoriesAction = async (orgUid?: string) => {
  const orgServiceCategories = await prismaTenant.serviceCategory.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      orgUid,
    },
    select: {
      id: true,
      name: true,
      Services: {
        select: {
          id: true,
          name: true,
          ServiceAttribute: {
            select: {
              duration: true,
              durationPadding: true,
              reminders: true,
              requirements: true,
            }
          }
        }
      },
    }
  });
  return orgServiceCategories;
}

