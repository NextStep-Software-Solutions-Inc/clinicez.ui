"use server";

import "server-only";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";

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