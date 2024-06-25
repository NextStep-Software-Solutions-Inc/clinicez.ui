"use server";

import { getSession } from '@auth0/nextjs-auth0';
import prisma from "@lib/prisma";
import { Prisma, UserOrganizationStatus } from "@prisma/client";
import { stat } from 'fs';
import { revalidatePath } from 'next/cache';

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
};

export const getOrganizationAction = async (id: number) => {

  const organization = await prisma.organization.findUnique({
    where: {
      id: id
    }
  });``

  return organization;
}

type FilterType = {
  userId?: string;
  orgId?: string;
  status?: UserOrganizationStatus;
  roleId?: number;
}

export const getUserOrganizationsAction = async (filter?: FilterType) => {
  const { userId, orgId, status, roleId } = filter || {};
  const organizations = await prisma.userOrganization.findMany({
    where: {
      ...roleId && { roleId },
      ...status && { status },
      ...orgId && {
        Organization: {
          orgId
        }
      },
      ...userId && {
        User: {
          isActive: true,
          userId
        }
      }
    },
    select: {
      id: true,
      createdAt: true,
      User: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true
        }
      },
      AcceptedBy: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true
        }
      },
      status: true,
      role: true,
      UserRole: {
        select: {
          id: true,
          name: true,
        }
      },
      Organization: {
        select: {
          name: true,
          orgId: true,
          id: true
        }
      }
    }
  });
  return organizations;

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

export const joinOrganizationAction = async ({ orgId, userId, roleId}:{
  orgId: string, userId: string, roleId: number
}) => {
  const org = await prisma.userOrganization.create({
    data: {
      UserRole: {
        connect: { id: roleId  }
      },
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgId }
      }
    }
  })
  return org;
}

export const getOrganizationRolesAction = async (orgId: string) => {
  const roles = await prisma.userOrganizationRole.findMany({
    where: {
      isActive: true,
      Organization: { orgId }
    }
  })
  return roles;
}

export const setMembershipRequestStatusAction = async (id: number, status: UserOrganizationStatus) => {
  const session = await getSession();
  const request = await prisma.userOrganization.update({
    where: { id },
    data: {
      status,
      ...status === "ACTIVE" && {
        AcceptedBy: {
          connect: {
            userId: session?.user.sub
          }
        }
      }
    }
  })
  revalidatePath(`/[organization]/membership`, "page")
  return request;
}