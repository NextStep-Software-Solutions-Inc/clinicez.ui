"use server";

import prisma from "@lib/prisma";

export const setDefaultOrgRoleAction = async ({
  id = 0,
  userId,
  orgId,
  roleId
}: {id?: number,userId:string, orgId: string, roleId: number}) => {
  return await prisma.userDefaultOrganizationRole.upsert({
    where: { id, User: { userId }, isActive: true, },
    update: { roleId  },
    create: {
      Organization: {
        connect: {
          orgId
        }
      },
      User: {
        connect: {
          userId
        }
      },
      UserRole: {
        connect: {
          id: roleId
        }
      }
    }
  })
};

export const getDefaultOrgRoleAction = async (userId: string) => {
  return await prisma.userDefaultOrganizationRole.findFirst({
    where: {
      User: { userId },
      isActive: true
    },
    select: {
      id: true,
      UserRole: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}