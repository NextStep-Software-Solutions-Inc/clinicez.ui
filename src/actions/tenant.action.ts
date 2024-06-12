import prisma from '@lib/prisma';
import { Prisma } from '@prisma/client';

export const getTenantsAction = async () => {

  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
    }
  });

  return tenants;
}

export const getMyTenantsAction = async (userId: string) => {
    
  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      Owner: {
        userId: userId
      }
    }
  });
    
  return tenants;
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