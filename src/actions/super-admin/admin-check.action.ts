"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

// The permission name that grants super admin access
const SUPER_ADMIN_PERMISSION = "SUPER_ADMIN";

/**
 * Check if the current user is a super admin
 * A user is considered a super admin if they have the SUPER_ADMIN permission
 */
export async function isSuperAdminAction(): Promise<boolean> {
  const session = await getCachedSession();

  if (!session?.user?.sub) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { userId: session.user.sub },
    select: {
      id: true,
      UserPermissions: {
        where: {
          Permission: {
            name: SUPER_ADMIN_PERMISSION,
            isActive: true,
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (user?.UserPermissions.length ?? 0) > 0;
}

/**
 * Check if the current user is a system admin
 * For now, we consider system admin the same as super admin
 */
export async function isSystemAdminAction(): Promise<boolean> {
  return await isSuperAdminAction();
}

/**
 * Get the current user's admin status
 */
export async function getAdminStatusAction(): Promise<{
  isSuperAdmin: boolean;
  isSystemAdmin: boolean;
}> {
  const isSuperAdmin = await isSuperAdminAction();

  return {
    isSuperAdmin,
    isSystemAdmin: isSuperAdmin,
  };
}
