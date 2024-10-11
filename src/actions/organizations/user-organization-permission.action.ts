"use server";
import "server-only";
import { getCachedSession } from "@actions/session.action";
import prismaCommon from "@lib/prisma-common";

type SetUserOrgPermissionsPayload = {
    userId: string,
    orgUid: string,
    permissionIds: number[]
}
export const setUserOrgPermissionsAction = async ({orgUid, userId, permissionIds}:SetUserOrgPermissionsPayload) => {
  const session = await getCachedSession();

  try {
    if (!session) throw new Error("User not authenticated");
    await prismaCommon.$transaction(async (prisma) => {
      const userOrganization = await prisma.userOrganization.findFirstOrThrow({
        where: {
          Organization: {
            orgId: orgUid,
          },
          User: {
            userId,
          }
        }
      })
      await prisma.orgUserPermission.deleteMany({
        where: {
          orgId: userOrganization.organizationId,
          userId: userOrganization.userId
        }
      });
      
      await prisma.orgUserPermission.createMany({
        skipDuplicates: true,
        data: permissionIds.map((permissionId) => ({
          orgId: userOrganization.organizationId,
          userId: userOrganization.userId,
          permissionId
        }))
      });
    });

    return {
      status: true,
      message: "User organization permissions set successfully"
    }
  } catch (error) {
    console.error(`Error setting user organization permissions: ${error}`);
    let message = "Error setting user organization permissions";
    if (error instanceof Error) {
      message = error.message;
    }
    return {
      status: false,
      message
    }
    
  }
};