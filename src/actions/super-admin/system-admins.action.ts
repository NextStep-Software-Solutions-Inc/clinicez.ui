"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

export type GetAllSystemAdmins = Awaited<ReturnType<typeof getAllSystemAdminsAction>>;
export async function getAllSystemAdminsAction({
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  // Check if current user is super admin
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can view system admins");
  }

  const where = {
    isSystemAdmin: true,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { userId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        isSystemAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function grantSystemAdminAction({
  userId,
}: {
  userId: number;
}) {
  // Check if current user is super admin
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can grant system admin privileges");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isSystemAdmin: true },
  });

  return { data: user };
}

export async function revokeSystemAdminAction({
  userId,
}: {
  userId: number;
}) {
  // Check if current user is super admin
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can revoke system admin privileges");
  }

  // Prevent revoking super admin's system admin status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    throw new Error("Cannot revoke system admin status from a super admin");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isSystemAdmin: false },
  });

  return { data: updatedUser };
}
