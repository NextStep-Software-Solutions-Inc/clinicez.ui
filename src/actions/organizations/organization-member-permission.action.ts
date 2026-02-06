"use server";

import "server-only";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import { hasOrgPermissionAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

type SetOrgMemberPermissionsPayload = {
    userId: string,
    orgUid: string,
    permissionIds: number[]
}
export const setOrgMemberPermissionsAction = async ({orgUid, userId, permissionIds}:SetOrgMemberPermissionsPayload) => {
  let message = "Member permissions set successfully";

  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const currentUserId = session.user.sub as string;

    // Check permissions
    const isSuperAdmin = await isSuperAdminAction();
    const hasPermission = await hasOrgPermissionAction({
      userId: currentUserId,
      orgUid,
      permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:PERMISSIONS"].name
    });

    if (!isSuperAdmin && !hasPermission) {
      throw new Error("You do not have permission to update member permissions");
    }

    await prisma.$transaction(async (prisma) => {
      const userOrganization = await prisma.organizationMember.findFirstOrThrow({
        where: {
          Organization: {
            orgUid,
          },
          User: {
            userId,
          }
        },
        select: {
          id: true
        }
      })
      await prisma.orgMemberPermission.deleteMany({
        where: { orgMemberId: userOrganization.id }
      });
      
      await prisma.orgMemberPermission.createMany({
        skipDuplicates: true,
        data: permissionIds.map((permissionId) => ({
          orgMemberId: userOrganization.id,
          permissionId
        }))
      });
    });

    return { status: true, message }
  } catch (error) {
    console.error(`Error setting organization member permissions: ${error}`);
    message = "Error setting organization member permissions";
    if (error instanceof Error) message = error.message;
    return { status: false,  message }
  }
};