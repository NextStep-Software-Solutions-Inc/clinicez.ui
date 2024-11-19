"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { OrganizationMemberStatus } from "@/types";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";


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
  

export type GetOrganizationsFilters = {
  userId?: string;
  orgUid?: string;
  clinicUid?: string;
}

export type GetOrganizations = Awaited<ReturnType<typeof getOrganizationsAction>>
export const getOrganizationsAction = cache(async (filters?: GetOrganizationsFilters) => {

  const { userId, clinicUid, orgUid } = filters || {};
  const organizations = await prisma.organization.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      ...(orgUid && { orgUid }),
      ...(userId && {
        Users: {
          every: {
            User: {
              userId
            }
          }
        }
      }),
      ...(clinicUid && {
        ClinicOrganizations: {
          some: {
            Clinic: {
              clinicUid
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


export const getMyDefaultOrganizationAction = cache(withErrorHandling(async () => {
  
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const org = await prisma.userDefaultOrganization.findFirst({
    where: {
      User: {
        userId: session.user.sub
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
  return { message: "Default organization fetched successfully", data: org };
}))

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