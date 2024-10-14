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
      description: true,
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

type CreateOrgServiceCategoryPayload = {
  orgUid: string;
  name: string;
  description?: string;
}
export const createOrgServiceCategoryAction = async (payload: CreateOrgServiceCategoryPayload) => {
  const { name, description, orgUid } = payload;
  try {
    await prismaTenant.serviceCategory.create({
      data: {
        name,
        description,
        orgUid
      }
    });
    return { status: true, message: "Service category created successfully" }
  } catch (error) {
    console.error(`Failed to create service category: ${error}`);
    let message = "Failed to create service category";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

type UpdateOrgServiceCategoryPayload = {
  id: number;
  name: string;
  description?: string;
}
export const updateOrgServiceCategoryAction = async (payload: UpdateOrgServiceCategoryPayload) => {
  const { id, name, description } = payload;
  try {
    await prismaTenant.serviceCategory.update({
      where: { id },
      data: {
        name,
        description
      }
    });
    return { status: true, message: "Service category updated successfully" }
  } catch (error) {
    console.error(`Failed to update service category: ${error}`);
    let message = "Failed to update service category";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

export const deleteServiceCategoryAction = async (id: number) => {
  try {
    await prismaTenant.serviceCategory.update({
      where: { id, isActive: true },
      data: {  isActive: false
      }
    });
    return { status: true, message: "Service category deleted successfully" }
  } catch (error) {
    console.error(`Failed to delete service category: ${error}`);
    let message = "Failed to delete service category";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}