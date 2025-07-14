"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";
import { sessionCheck } from "@/lib/auth";


type SetDefaultOrgRolePayload = {
  id?: number,
  userId: string,
  orgUid: string,
  roleId: number
}
export const setDefaultOrgRoleAction = withErrorHandling(async ({ userId, orgUid, roleId }: SetDefaultOrgRolePayload) => {
  await sessionCheck()

  // First, find existing record by userId and orgUid
  const existing = await prisma.userDefaultOrganizationRole.findFirst({
    where: {
      User: { userId },
      Organization: { orgUid },
      isActive: true
    }
  });

  let defaultRole;
  if (existing) {
    // Update existing
    defaultRole = await prisma.userDefaultOrganizationRole.update({
      where: { id: existing.id },
      data: { roleId }
    });
  } else {
    // Create new
    defaultRole = await prisma.userDefaultOrganizationRole.create({
      data: {
        Organization: { connect: { orgUid } },
        User: { connect: { userId } },
        OrganizationRole: { connect: { id: roleId } },
        isActive: true
      }
    });
  }

  return {message: "Default organization role successfully set", data: defaultRole}
}, async (error) => {
  if(hasCodeProperty(error) && error.code === "P2002") {
    return "Default organization role not found"
  }
  return "Error while setting default organization role";
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
