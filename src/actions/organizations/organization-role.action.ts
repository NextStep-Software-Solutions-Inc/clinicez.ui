"use server";

import "server-only";
import prisma from "@lib/prisma-common";
import { UserOrganizationStatus } from "@prisma/common/client";
import { cache } from "react";

type CreateOrgRolePayload = {
  orgUid: string;
  name: string;
  description: string;
}

export const createOrgRoleAction = async (payload: CreateOrgRolePayload) => {
  try {
    const newOrgRole = await prisma.userOrganizationRole.create({
      data: {
        Organization: {
          connect: {
            orgId: payload.orgUid
          }
        },
        name : payload.name,
        description: payload.description,
        requirements: [],
      }
    })
    return {
      status: true,
      message: "Role created successfully",
      data: newOrgRole
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Error while creating role",
      data: null
    }
  }
}

type FiltersType = {
    userId?: string | null;
    orgId?: string | null;
    status?: UserOrganizationStatus | null;
  }
  
export type GetOrganizationRoles = Awaited<ReturnType<typeof getOrganizationRolesAction>>
export const getOrganizationRolesAction = cache(async (filter?: FiltersType) => {
  const {userId, orgId, status} = filter || { status: "ACTIVE"};
  const roles = await prisma.userOrganizationRole.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      isActive: true,
      ...orgId && { Organization: { orgId } },
      ...userId && { 
        UserOrganizations: {
          some: {
            ...status ? { status }: {},
            User: {
              userId
            }
          }
        
        }
      }
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      requirements: true,
      UserDefaultOrganizationRoles: {
        where: {
          isActive: true,
          User: {
            ...userId ? { userId } : {}
          }
        },
        select: {
          id: true,
          Organization: {
            select: {
              orgId: true,
            }
          },
          UserRole: {
            select: {
              id: true,
              name: true
            }
          },
          User: {
            select: {
              userId: true
            }
          }
        }
      },
      OrgRoleAppointmentTabs: {
        select: {
          orgRoleId: true,
          OrgAppointmentTab: {
            select: {
              id: true,
              AppointmentTab: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      },
    }
  })
  return roles;
})


export const setOrgRoleRequirementsAction = async (orgRoleId: number, requirements: string[]) => {
  try {
    await prisma.userOrganizationRole.update({
      where: {
        isActive: true,
        id: orgRoleId
      },
      data: { requirements }
    })
    return {
      status: true,
      message: "Role requirements updated successfully"
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Error while updating role requirements"
    }
  }
}

export const deleteOrgRoleAction = async (orgRoleId: number) => {
  try {
    await prisma.userOrganizationRole.update({
      where: {
        isActive: true,
        id: orgRoleId
      },
      data: { isActive: false }
    })
    return {
      status: true,
      message: "Role deleted successfully"
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Error while deleting role"
    }
  }
}