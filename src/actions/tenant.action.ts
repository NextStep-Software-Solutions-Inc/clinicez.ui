import prisma from '@lib/prisma-common';
import { Prisma } from '@prisma/common/client';
import { getCachedSession } from './session.action';

export const getTenantsAction = async () => {

  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
    }
  });

  return tenants;
}

export type GetMyTenants = ReturnType<typeof getMyTenantsAction>;
export const getMyTenantsAction = async (userId: string) => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("Unauthorized");
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        Owner: {
          userId: userId
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return { success: true, data: tenants, message: "Tenants fetched successfully" };
  } catch (error) {
    console.error(`Error fetching tenants for user ${userId}: ${error}`);
    let message = "An error occurred while fetching tenants";
    if(error instanceof Error) message = error.message;
    return { success: false, message: message, data: [] }
  }
}

export const getTenantAction = async (id: number) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: id
    }
  });
  return tenant;
}

export const createTenantAction = async (data: Prisma.TenantCreateArgs["data"]) => {
  const newTenant = await prisma.tenant.create({
    data: {
      ...data
    }
  });

  return newTenant;
}