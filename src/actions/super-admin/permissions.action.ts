"use server";

import "server-only";
import prisma from "@lib/prisma";
import { PermissionType } from "@/types";

export type GetAllPermissions = Awaited<ReturnType<typeof getAllPermissionsAction>>;
export async function getAllPermissionsAction({
  type,
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  type?: PermissionType;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(type ? { type } : {}),
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.permission.count({ where }),
  ]);

  return {
    data: permissions,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type CreatePermission = Awaited<ReturnType<typeof createPermissionAction>>;
export async function createPermissionAction({
  name,
  description,
  type = "USER",
}: {
  name: string;
  description?: string;
  type?: PermissionType;
}) {
  const permission = await prisma.permission.create({
    data: {
      name,
      description,
      type,
    },
  });

  return { data: permission };
}

export type UpdatePermission = Awaited<ReturnType<typeof updatePermissionAction>>;
export async function updatePermissionAction({
  id,
  name,
  description,
  type,
  isActive,
}: {
  id: number;
  name?: string;
  description?: string;
  type?: PermissionType;
  isActive?: boolean;
}) {
  const permission = await prisma.permission.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return { data: permission };
}

export async function deletePermissionAction(id: number) {
  await prisma.permission.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return { success: true };
}
/**
 * Get all permissions assigned to a user
 */
export async function getUserPermissionsAction(userId: number) {
  try {
    const permissions = await prisma.userPermission.findMany({
      where: {
        userId,
        Permission: {
          isActive: true,
          deletedAt: null
        }
      },
      include: {
        Permission: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true
          }
        }
      }
    })

    return { success: true, data: permissions }
  } catch (error) {
    console.error('[GET_USER_PERMISSIONS_ERROR]', error)
    return { success: false, error: 'Failed to fetch user permissions' }
  }
}

/**
 * Get all available permissions
 */
export async function getAllAvailablePermissionsAction() {
  try {
    const permissions = await prisma.permission.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    })

    return { success: true, data: permissions }
  } catch (error) {
    console.error('[GET_ALL_AVAILABLE_PERMISSIONS_ERROR]', error)
    return { success: false, error: 'Failed to fetch permissions' }
  }
}

/**
 * Assign a permission to a user
 */
export async function assignPermissionToUserAction(
  userId: number,
  permissionId: number
) {
  try {
    // Check if already assigned
    const existing = await prisma.userPermission.findFirst({
      where: { userId, permissionId }
    })

    if (existing) {
      return { success: false, error: 'User already has this permission' }
    }

    await prisma.userPermission.create({
      data: { userId, permissionId }
    })

    return { success: true, message: 'Permission assigned successfully' }
  } catch (error) {
    console.error('[ASSIGN_PERMISSION_ERROR]', error)
    return { success: false, error: 'Failed to assign permission' }
  }
}

/**
 * Revoke a permission from a user
 */
export async function revokePermissionFromUserAction(
  userId: number,
  permissionId: number
) {
  try {
    await prisma.userPermission.deleteMany({
      where: { userId, permissionId }
    })

    return { success: true, message: 'Permission revoked successfully' }
  } catch (error) {
    console.error('[REVOKE_PERMISSION_ERROR]', error)
    return { success: false, error: 'Failed to revoke permission' }
  }
}

/**
 * Assign all permissions to a user
 */
export async function assignAllPermissionsToUserAction(userId: number) {
  try {
    const allPermissions = await prisma.permission.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      select: { id: true }
    })

    const existingPermissions = await prisma.userPermission.findMany({
      where: { userId },
      select: { permissionId: true }
    })

    const existingIds = new Set(existingPermissions.map(p => p.permissionId))
    const permissionsToAdd = allPermissions
      .filter(p => !existingIds.has(p.id))
      .map(p => ({ userId, permissionId: p.id }))

    if (permissionsToAdd.length > 0) {
      await prisma.userPermission.createMany({
        data: permissionsToAdd,
        skipDuplicates: true
      })
    }

    return {
      success: true,
      message: `${permissionsToAdd.length} permission(s) assigned successfully`
    }
  } catch (error) {
    console.error('[ASSIGN_ALL_PERMISSIONS_ERROR]', error)
    return { success: false, error: 'Failed to assign permissions' }
  }
}