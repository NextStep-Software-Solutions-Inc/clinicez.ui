"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

// The permission name that grants super admin access
const SUPER_ADMIN_PERMISSION = "SUPER_ADMIN";

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

  // Get the SUPER_ADMIN permission ID
  const superAdminPermission = await prisma.permission.findUnique({
    where: { name: SUPER_ADMIN_PERMISSION, isActive: true },
    select: { id: true },
  });

  if (!superAdminPermission) {
    // If permission doesn't exist, return empty list
    return {
      data: [],
      total: 0,
      pageSize,
      pageNumber,
      totalPages: 0,
    };
  }

  // Find users who have the SUPER_ADMIN permission
  const where = {
    UserPermissions: {
      some: {
        permissionId: superAdminPermission.id,
      },
    },
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
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  // Transform data to match expected format
  const data = users.map(user => ({
    ...user,
    isSuperAdmin: true,
    isSystemAdmin: true,
  }));

  return {
    data,
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

  // Get or create the SUPER_ADMIN permission
  let superAdminPermission = await prisma.permission.findUnique({
    where: { name: SUPER_ADMIN_PERMISSION },
    select: { id: true },
  });

  if (!superAdminPermission) {
    // Create the SUPER_ADMIN permission if it doesn't exist
    superAdminPermission = await prisma.permission.create({
      data: {
        name: SUPER_ADMIN_PERMISSION,
        description: "Super administrator with full system access",
        type: "USER",
        isActive: true,
      },
      select: { id: true },
    });
  }

  // Check if user already has the permission
  const existingPermission = await prisma.userPermission.findFirst({
    where: {
      userId,
      permissionId: superAdminPermission.id,
    },
  });

  if (!existingPermission) {
    // Grant the SUPER_ADMIN permission to the user
    await prisma.userPermission.create({
      data: {
        userId,
        permissionId: superAdminPermission.id,
      },
    });
  }

  // Get updated user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
    },
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

  // Get the SUPER_ADMIN permission
  const superAdminPermission = await prisma.permission.findUnique({
    where: { name: SUPER_ADMIN_PERMISSION },
    select: { id: true },
  });

  if (superAdminPermission) {
    // Remove the SUPER_ADMIN permission from the user
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: superAdminPermission.id,
      },
    });
  }

  // Get updated user
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
    },
  });

  return { data: updatedUser };
}
