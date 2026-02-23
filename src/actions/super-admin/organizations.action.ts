"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

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

export type GetOrgMembersForAdmin = Awaited<ReturnType<typeof getOrgMembersForAdminAction>>;
export async function getOrgMembersForAdminAction({
  orgId,
  search,
  cursor,
  take = 20,
}: {
  orgId: number;
  search?: string;
  cursor?: number;
  take?: number;
}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }

  const where = {
    organizationId: orgId,
    ...(search
      ? {
        User: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }
      : {}),
  };

  const members = await prisma.organizationMember.findMany({
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
    select: {
      id: true,
      status: true,
      createdAt: true,
      User: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      OrganizationRole: {
        select: {
          id: true,
          name: true,
        },
      },
      OrgMemberPermissions: {
        select: {
          permissionId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const hasMore = members.length > take;
  const data = hasMore ? members.slice(0, take) : members;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, hasMore, nextCursor };
}

export async function getOrgMemberPermissionsForAdminAction(orgMemberId: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }

  const permissions = await prisma.orgMemberPermission.findMany({
    where: { orgMemberId },
    select: { permissionId: true },
  });
  return { data: permissions };
}

export async function setOrgMemberPermissionsForAdminAction({
  orgMemberId,
  permissionIds,
}: {
  orgMemberId: number;
  permissionIds: number[];
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can update permissions" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.orgMemberPermission.deleteMany({ where: { orgMemberId } });
      if (permissionIds.length > 0) {
        await tx.orgMemberPermission.createMany({
          skipDuplicates: true,
          data: permissionIds.map((permissionId) => ({ orgMemberId, permissionId })),
        });
      }
    });
    return { success: true, message: "Permissions updated successfully" };
  } catch (error) {
    console.error("[SET_ORG_MEMBER_PERMISSIONS_ERROR]", error);
    return { success: false, error: "Failed to update permissions" };
  }
}
