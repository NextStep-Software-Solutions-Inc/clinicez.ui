"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { OrganizationMemberStatus } from "@/types";
import { getCachedSession } from "@actions/session.action";


type CreateOrganizationPayload = {
  tenantUid: string;
  orgUid: string;
  name: string;
  description: string;
  logo?: string;
  customUrl?: string;
  email: string;
}
export const createOrganizationAction = async (data: CreateOrganizationPayload) => {

  const { orgUid, tenantUid, name, description, logo, customUrl, email } = data;
  const newOrganization = await prisma.organization.create({
    data: { 
      Tenant: {
        connect: {
          tenantUid
        }
      },
      orgUid,
      name,
      description,
      logo,
      customUrl,
      email,
      
    }
  });
  return newOrganization;
};
  

type FiltersType = {
  userId?: string;
  orgUid?: string;
  status?: OrganizationMemberStatus;
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
export const getOrganizationAction = cache(async (key: string | number) => {

  const organization = await prisma.organization.findFirst({
    where: {
      isActive: true,
      OR: [
        {...!isNaN(Number(key))? {id: Number(key)} : {}}, 
        {orgUid: String(key)}
      ]
    },
    include: {
      Tenant: {
        select: {
          id: true,
          tenantUid: true
        }
      },
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
          orgUid: true,
          id: true
        }
      }
    }
  })
  return org;
})

export const setMyDefaultOrganizationAction = async (id: number, orgUid: string, userId?: string) => {
  const org = await prisma.userDefaultOrganization.upsert({
    where: { id, User: { userId } },
    create: {
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgUid }
      },
    },
    update: {
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgUid }
      },
    }
  })
  return org;
}

type UpdateOrganizationPayload = {
  name: string;
  description?: string;
  logo: string;
  customUrl?: string;
  email: string;
  isPublic: boolean;
  sendEmailNotification: boolean;
  emailToOrgOnly: boolean;
}
export const updateOrganizationAction = async (orgUid: string, data: UpdateOrganizationPayload) => {

  let message = "Organization updated successfully";

  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const {name, logo, description, customUrl, email, isPublic, sendEmailNotification, emailToOrgOnly} = data;
    const organization = await prisma.organization.update({
      where: { orgUid, isActive: true },
      data: {
        name,
        description,
        logo,
        customUrl,
        email,
        OrganizationSetting: {
          upsert: {
            where:{
              Organization: {
                orgUid
              }
            },
            create: {
              isPublic,
              sendEmailNotification,
              emailToOrgOnly,
            },
            update: {
              isPublic,
              sendEmailNotification,
              emailToOrgOnly,
            }
          }
        }
      },
      include: {
        OrganizationSetting: true,
      }
    });
    return { status: true, message, data: organization };
  } catch (error) {
    console.error("Error updating organization", error);
    message = "Error updating organization";
    if(error instanceof Error) message = error.message;
    return { status: false, message, data: null}
  }
}