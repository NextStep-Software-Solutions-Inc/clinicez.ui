"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";

export type GetPermissions = Awaited<ReturnType<typeof getPermissionsAction>>;
export async function getPermissionsAction(userId: string) {
  const permissions = await prismaCommon.permission.findMany({
    where: {
      isActive: true,
      OrgUserPermissions: {
        some: {
          User: {
            userId
          }
        }
      }
    }, 
    select: {
      name: true
    }
  })
  return permissions;
}
