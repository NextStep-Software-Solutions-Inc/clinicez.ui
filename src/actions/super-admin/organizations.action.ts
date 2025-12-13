"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetOrganizationById = Awaited<ReturnType<typeof getOrganizationByIdAction>>;
export async function getOrganizationByIdAction({
  orgId,
}: {
  orgId: number;
}) {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      orgUid: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      Tenant: {
        select: {
          id: true,
          tenantUid: true,
          name: true,
        },
      },
      _count: {
        select: {
          OrganizationMembers: true,
          OrganizationRoles: true,
        },
      },
    },
  });

  return organization;
}

export type GetOrganizationRoles = Awaited<ReturnType<typeof getOrganizationRolesAction>>;
export async function getOrganizationRolesAction({
  orgId,
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  orgId: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    orgId,
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
        requirements: true,
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
  };
}

export async function createOrganizationRoleAction({
  orgId,
  name,
  description,
}: {
  orgId: number;
  name: string;
  description?: string;
}) {
  const role = await prisma.organizationRole.create({
    data: {
      orgId,
      name,
      description,
    },
  });

  return { data: role };
}

export async function updateOrganizationRoleAction({
  id,
  name,
  description,
  isActive,
}: {
  id: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  const role = await prisma.organizationRole.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return { data: role };
}

export async function deleteOrganizationRoleAction(id: number) {
  await prisma.organizationRole.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  return { success: true };
}
