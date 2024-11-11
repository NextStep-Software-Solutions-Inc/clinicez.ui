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
      description: true,
      ServiceCategory: {
        select: {
          name: true
        }
      },
      ServiceAttribute: {
        select: {
          duration: true,
          durationPadding: true
        }
      }
    }
  });
  return orgServices;
}

type CreateOrgServicePayload = {
  name: string;
  description: string;
  duration: number;
  durationPadding: number;
  categoryId: number;  
}
export const createOrgServiceAction = async (payload: CreateOrgServicePayload) => {
  const { name, description, duration, durationPadding, categoryId } = payload;
  try {
    await prismaTenant.service.create({
      data: {
        name,
        description,
        categoryId,
        ServiceAttribute: {
          create: {
            duration,
            durationPadding
          }
        }
      }
    });
    return { status: true, message: "Service created successfully" }
  } catch (error) {
    console.error(`Failed to create service: ${error}`);
    let message = "Failed to create service";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

type UpdateOrgServicePayload = {
  id: number;
  name: string;
  description: string;
  duration: number;
  durationPadding: number;
}
export const updateOrgServiceAction = async (payload: UpdateOrgServicePayload) => {
  const { id, name, description, duration, durationPadding } = payload;
  try {
    await prismaTenant.service.update({
      where: { id, isActive: true },
      data: {
        name,
        description,
        ServiceAttribute: {
          update: {
            duration,
            durationPadding
          }
        }
      }
    });
    return { status: true, message: "Service updated successfully" }
  } catch (error) {
    console.error(`Failed to update service: ${error}`);
    let message = "Failed to update service";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

export const deleteOrgServiceAction = async (id: number) => {
  try {
    await prismaTenant.service.update({
      where: { id, isActive: true },
      data: {
        isActive: false
      }
    });
    return { status: true, message: "Service deleted successfully" }
  } catch (error) {
    console.error(`Failed to delete service: ${error}`);
    let message = "Failed to delete service";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}