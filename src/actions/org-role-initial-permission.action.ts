"use server";

import "server-only";
import prisma from "@lib/prisma";

type GetOrgRoleInitialPermissionsFilters = {
  orgUid: string;
  orgRoleId: number;
}
export type GetOrgRoleInitialPermissions = Awaited<ReturnType<typeof getOrgRoleInitialPermissionsAction>>;
export async function getOrgRoleInitialPermissionsAction({orgRoleId, orgUid}: GetOrgRoleInitialPermissionsFilters) {

  const orgRoleInitialPermissions = await prisma.orgRoleInitialPermission.findMany({
    where: {
      orgRoleId: orgRoleId,
      Organization: {
        orgUid
      }
    }, 
    select: {
      id: true,
      orgId: true,
      Permission: {
        select: {
          id: true,
          name: true,
          description: true,
        }
      }
    }
  })
  return orgRoleInitialPermissions;
}


type SetOrgRoleInitialPermissionsPayload = {
  orgRoleId: number,
   orgUid: string,
  permissionIds: number[]
}
export const setOrgRoleInitialPermissionsAction = async ({orgRoleId, orgUid, permissionIds}:SetOrgRoleInitialPermissionsPayload) => {

  try {
    await prisma.$transaction(async (prisma) => {
      const organization = await prisma.organization.findUniqueOrThrow({
        where: {
          orgUid
        }
      })
      await prisma.orgRoleInitialPermission.deleteMany({
        where: {
          orgRoleId: orgRoleId,
          orgId: organization.id
        }
      })
      await prisma.orgRoleInitialPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          orgRoleId,
          permissionId,
          orgId: organization.id
        }))
      })
    })
    return {
      status: true,
      message: "Permission updated successfully"
    }
  } catch (error) {
    console.error(`Error while updating permissions: ${error}`);
    return {
      status: false,
      message: "Error while updating permissions"
    }
  }
}