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
  isPublic?: boolean;
}

export const getOrganizationsV2Action = cache(async (filters?: GetOrganizationsFilters) => {
  const { userId, clinicUid, orgUid, isPublic } = filters || {}

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      ...(orgUid && { orgUid }),
      ...(isPublic !== undefined && {
        OrganizationSetting: {
          isPublic,
        },
      }),
      ...(userId && {
        Users: {
          every: {
            User: {
              userId,
            },
          },
        },
      }),
      ...(clinicUid && {
        ClinicOrganizations: {
          some: {
            Clinic: {
              clinicUid,
            },
          },
        },
      }),
    },
    select: {
      orgUid: true,
      name: true,
      description: true,
      logo: true,
      OrganizationMembers: {
        select: { id: true },
      },
    },
  })

  return organizations.map((org) => ({
    orgUid: org.orgUid,
    name: org.name,
    description: org.description,
    memberCount: org.OrganizationMembers.length,
    logo: org.logo
  }))
})
export type GetOrganizationsV2 = Awaited<ReturnType<typeof getOrganizationsV2Action>>

export type GetOrganizations = Awaited<ReturnType<typeof getOrganizationsAction>>
export const getOrganizationsAction = cache(async (filters?: GetOrganizationsFilters) => {

  const { userId, clinicUid, orgUid, isPublic } = filters || {};
  const organizations = await prisma.organization.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      OrganizationSetting: {
        ...(isPublic ? { isPublic } : {})
      },
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
        {...(!isNaN(Number(key)) ? {id: Number(key)} : {})}, 
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

  let org = await prisma.userDefaultOrganization.findFirst({
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
  });

  // Fallback: if no default org, get first active org membership
  if (!org) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        User: {
          userId: session.user.sub
        },
        Organization: {
          isActive: true
        },
        status: "ACTIVE"
      },
      select: {
        Organization: {
          select: {
            name: true,
            orgUid: true,
            id: true
          }
        }
      }
    });
    if (membership) {
      org = { id: 0, Organization: membership.Organization };
    }
  }

  return { message: "Default organization fetched successfully", data: org };
}))

export const setMyDefaultOrganizationAction = withErrorHandling(async (id: number, orgUid: string, userId?: string) => {
 
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");
 
  const org = await prisma.userDefaultOrganization.upsert({
    where: { id },
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
  return { message: "Default organization updated successfully", data: org };
})

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