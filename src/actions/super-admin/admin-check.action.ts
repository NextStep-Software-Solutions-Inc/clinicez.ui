"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "./session.action";

/**
 * Check if the current user is a super admin
 */
export async function isSuperAdminAction(): Promise<boolean> {
  const session = await getCachedSession();
  
  if (!session?.userId) {
    return false;
  }
  
  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    select: { isSuperAdmin: true },
  });
  
  return user?.isSuperAdmin ?? false;
}

/**
 * Check if the current user is a system admin
 */
export async function isSystemAdminAction(): Promise<boolean> {
  const session = await getCachedSession();
  
  if (!session?.userId) {
    return false;
  }
  
  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    select: { isSystemAdmin: true, isSuperAdmin: true },
  });
  
  // Super admins also have system admin privileges
  return user?.isSystemAdmin || user?.isSuperAdmin || false;
}

/**
 * Get the current user's admin status
 */
export async function getAdminStatusAction(): Promise<{
  isSuperAdmin: boolean;
  isSystemAdmin: boolean;
}> {
  const session = await getCachedSession();
  
  if (!session?.userId) {
    return { isSuperAdmin: false, isSystemAdmin: false };
  }
  
  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    select: { isSuperAdmin: true, isSystemAdmin: true },
  });
  
  return {
    isSuperAdmin: user?.isSuperAdmin ?? false,
    isSystemAdmin: user?.isSystemAdmin ?? false,
  };
}
