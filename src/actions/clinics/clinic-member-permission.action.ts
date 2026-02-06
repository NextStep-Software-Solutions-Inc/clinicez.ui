"use server";

import "server-only";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import { hasClinicPermissionAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

type SetOrgMemberPermissionsPayload = {
    userId: string,
    clinicUid: string,
    permissionIds: number[]
}
export const setClinicMemberPermissionsAction = async ({clinicUid, userId, permissionIds}:SetOrgMemberPermissionsPayload) => {
  let message = "Member permissions set successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const currentUserId = session.user.sub as string;

    // Check permissions in parallel
    const [isSuperAdmin, hasPermission] = await Promise.all([
      isSuperAdminAction(),
      hasClinicPermissionAction({
        userId: currentUserId,
        clinicUid,
        permissionName: PERMISSIONS.CLINIC["UPDATE:CLINIC:PERMISSIONS"].name
      })
    ]);

    if (!isSuperAdmin && !hasPermission) {
      throw new Error("You do not have permission to update member permissions");
    }

    await prisma.$transaction(async (prisma) => {
      const clinicMember = await prisma.clinicMember.findFirstOrThrow({
        where: {
          Clinic: {
            clinicUid,
          },
          User: {
            userId,
          }
        },
        select: {
          id: true
        }
      })
      await prisma.clinicMemberPermission.deleteMany({
        where: { clinicMemberId: clinicMember.id }
      });
      
      await prisma.clinicMemberPermission.createMany({
        skipDuplicates: true,
        data: permissionIds.map((permissionId) => ({
          clinicMemberId: clinicMember.id,
          permissionId
        }))
      });
    });
    
    return { status: true, message }
  } catch (error) {
    console.error(`Error setting clinic member permissions: ${error}`);
    message = "Error setting clinic member permissions";
    if (error instanceof Error) message = error.message;
    return { status: false,  message }
  }
};