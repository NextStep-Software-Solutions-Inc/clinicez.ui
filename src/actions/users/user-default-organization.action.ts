"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";


type SetDefaultOrgRolePayload = {
  id?: number,
  userId: string,
  orgUid: string,
  roleId: number
}
export const setDefaultOrgRoleAction = withErrorHandling(async ({ id = 0, userId, orgUid, roleId }: SetDefaultOrgRolePayload) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Session not found") 
  const defaultRole = await prisma.userDefaultOrganizationRole.upsert({
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
  return {message: "Default organization role successfully set", data: defaultRole}
 
}, (error) => {
  if(hasCodeProperty(error) && error.code === "P2025") {
    return "Default organization role not found"
  }
  return "An error occurred while setting default organization role"
});

export const getDefaultOrgRoleAction = withErrorHandling(async (userId: string) => {
  return {
    message: "Default organization role retrieved successfully",
    data: await prisma.userDefaultOrganizationRole.findFirst({
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
})
