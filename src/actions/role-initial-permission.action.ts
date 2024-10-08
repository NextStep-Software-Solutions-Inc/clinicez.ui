"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";

type GetOrgRoleInitialPermissionsFilters = {
  orgUid: string;
  orgRoleId: number;
}
export type GetOrgRoleInitialPermissions = Awaited<ReturnType<typeof getOrgRoleInitialPermissionsAction>>;
export async function getOrgRoleInitialPermissionsAction({orgRoleId, orgUid}: GetOrgRoleInitialPermissionsFilters) {

  const orgRoleInitialPermissions = await prismaCommon.orgRoleInitialPermission.findMany({
    where: {
      orgRoleId: orgRoleId,
      Organization: {
        orgId: orgUid
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
    await prismaCommon.$transaction(async (prisma) => {
      const organization = await prisma.organization.findUniqueOrThrow({
        where: {
          orgId: orgUid
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