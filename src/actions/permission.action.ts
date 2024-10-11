"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";

export type GetPermissions = Awaited<ReturnType<typeof getPermissionsAction>>;
export async function getPermissionsAction({userId, type}: {userId?: string, type?: string}) {

  const permissions = await prismaCommon.permission.findMany({
    where: {
      isActive: true,
      ...type ? { type } : {},
      ...userId ? {
        OrgUserPermissions: {
          some: {
            User: {
              userId
            }
          }
        }
      } : {}
    }, 
    select: {
      id: true,
      name: true,
      description: true,
    }
  })
  return permissions;
}
