"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetAllRoles = Awaited<ReturnType<typeof getAllRolesAction>>;
export async function getAllRolesAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
  type,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
  type?: "CLINIC" | "ORGANIZATION";
}) {
  if (type === "CLINIC") {
    const where = {
      ...(!includeInactive ? { isActive: true } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [roles, total] = await Promise.all([
      prisma.clinicRole.findMany({
        where,
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ClinicMembers: true,
              ClinicRoleInitialPermissions: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clinicRole.count({ where }),
    ]);

    return {
      data: roles,
      total,
      pageSize,
      pageNumber,
      totalPages: Math.ceil(total / pageSize),
      type: "CLINIC" as const,
    };
  }

  // For organization roles, we need to get all roles from all organizations
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [roles, total] = await Promise.all([
    prisma.organizationRole.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        Organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            OrganizationMembers: true,
            OrgRoleInitialPermissions: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.organizationRole.count({ where }),
  ]);

  return {
    data: roles,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
    type: "ORGANIZATION" as const,
  };
}

export async function createClinicRoleAction({ name }: { name: string }) {
  const role = await prisma.clinicRole.create({
    data: { name },
  });

  return { data: role };
}

export async function updateClinicRoleAction({
  id,
  name,
  isActive,
}: {
  id: number;
  name?: string;
  isActive?: boolean;
}) {
  const role = await prisma.clinicRole.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return { data: role };
}

export async function deleteClinicRoleAction(id: number) {
  await prisma.clinicRole.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return { success: true };
}
