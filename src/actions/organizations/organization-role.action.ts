"use server";

import "server-only";
import prisma from "@lib/prisma-common";
import { UserOrganizationStatus } from "@prisma/common/client";
import { cache } from "react";

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
      requirements: true
    }
  })
  return roles;
})
