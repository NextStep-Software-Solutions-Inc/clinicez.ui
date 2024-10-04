"use server";

import "server-only";
import prisma from "@lib/prisma-common";
import { Prisma, UserOrganizationStatus } from "@prisma/common/client";
import { cache } from "react";

export const createOrganizationAction = async (data: Prisma.OrganizationCreateArgs["data"]) => {

  const newOrganization = await prisma.organization.create({
    data: { 
      ...data
    }
  });
  
  return newOrganization;
};
  

type FiltersType = {
  userId?: string | null;
  orgId?: string | null;
  status?: UserOrganizationStatus | null;
}

export type GetOrganizations = Awaited<ReturnType<typeof getOrganizationsAction>>
export const getOrganizationsAction = cache(async (filters?: FiltersType) => {

  const { userId } = filters || {};
  const organizations = await prisma.organization.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      ...(userId && {
        Users: {
          every: {
            User: {
              userId
            }
          }
        }
      }),
      isActive: true
    }
  });
    
  return organizations;
});

export type GetOrganization = Awaited<ReturnType<typeof getOrganizationAction>>
export const getOrganizationAction = cache(async (orgId: string) => {

  const organization = await prisma.organization.findUnique({
    where: {
      isActive: true,
      orgId
    },
    include: {
      OrganizationSetting: true,
    }
  });
  return organization;
})


export const getMyDefaultOrganizationAction = cache(async (userId: string) => {
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
})

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

type UpdateOrganizationArgs = {
  name: string;
  description?: string;
  picture: string;
  cover?: string;
  customUrl?: string;
  email: string;
  isPublic: boolean;
  sendEmailNotification: boolean;
  emailToOrgOnly: boolean;
}
export const updateOrganizationAction = async (orgId: string, data: UpdateOrganizationArgs) => {
  const organization = await prisma.organization.update({
    where: { orgId, isActive: true },
    data: {
      name: data.name,
      description: data.description,
      picture: data.picture,
      cover: data.cover,
      customUrl: data.customUrl,
      email: data.email,
      OrganizationSetting: {
        upsert: {
          where:{
            Organization: {
              orgId
            }
          },
          create: {
            isPublic: data.isPublic,
            sendEmailNotification: data.sendEmailNotification,
            emailToOrgOnly: data.emailToOrgOnly
          },
          update: {
            isPublic: data.isPublic,
            sendEmailNotification: data.sendEmailNotification,
            emailToOrgOnly: data.emailToOrgOnly
          }
        }
      }
    }
  });
  return organization;
}