"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";
import { PermissionType } from "../types";

export type GetPermissions = Awaited<ReturnType<typeof getPermissionsAction>>;
export async function getPermissionsAction({userId, type}: {userId?: string, type?: PermissionType}) {

  const permissions = await prismaCommon.permission.findMany({
    where: {
      isActive: true,
      ...type ? { type } : {},
      ...userId ? {
        OR: [
          {
            OrgUserPermissions: {
              some: {
                User: {
                  userId
                }
              }
            }
          },
          {
            UserPermissions: {
              some: {
                User: {
                  userId
                }
              }
            }
          }
        ]
      } : {} ,
    }, 
    select: {
      id: true,
      name: true,
      description: true,
    }
  })
  return permissions;
}
