"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";

export const createOrganizationAction = async (data: Prisma.OrganizationCreateArgs["data"]) => {

  const newOrganization = await prisma.organization.create({
    data: { 
      ...data
    }
  });
  
  return newOrganization;
};
  

type FiltersType = {
  userId?: string;
}
export const getOrganizationsAction = async (filters?: FiltersType) => {

  const { userId } = filters || {};
  const organizations = await prisma.organization.findMany({
    where: {
      ...(userId && {
        Users: {
          every: {
            user: {
              userId
            }
          }
        }
      }),
      isActive: true
    }
  });
    
  return organizations;
};

export const getOrganizationAction = async (id: number) => {

  const organization = await prisma.organization.findUnique({
    where: {
      id: id
    }
  });

  return organization;
}

export const getMyDefaultOrganizationAction = async (userId: string) => {
  const org = await prisma.userDefaultOrganization.findFirst({
    where: {
      User: {
        userId
      }
    },
    select: {
      id: true,
      Organization: {
        select: {
          name: true,
          orgId: true,
          id: true
        }
      }
    }
  })
  return org;
}

export const setMyDefaultOrganizationAction = async (id: number, orgId: string, userId?: string) => {
  const org = await prisma.userDefaultOrganization.upsert({
    where: { id, User: { userId } },
    create: {
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgId }
      },
    },
    update: {
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgId }
      },
    }
  })
  return org;
}