"use server";

import prisma from "@lib/prisma";

export const setDefaultOrgRoleAction = async ({
  id = 0,
  userId,
  orgUid,
  roleId
}: {id?: number,userId:string, orgUid: string, roleId: number}) => {
  return await prisma.userDefaultOrganizationRole.upsert({
    where: { id, User: { userId }, isActive: true, },
    update: { roleId  },
    create: {
      Organization: {
        connect: {
          orgUid
        }
      },
      User: {
        connect: {
          userId
        }
      },
      OrganizationRole: {
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
      OrganizationRole: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}