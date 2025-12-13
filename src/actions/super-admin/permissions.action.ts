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
