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

export async function addOrgMemberForAdminAction({
  orgId,
  userEmail,
  roleId,
}: {
  orgId: number;
  userEmail: string;
  roleId: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can perform this action" };
    }

    const session = await prisma.user.findFirst(); // will resolve admin user below
    if (!userEmail?.trim()) {
      return { success: false, error: "User email is required" };
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail.trim().toLowerCase() },
    });
    if (!user) {
      return { success: false, error: `User with email "${userEmail}" not found` };
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, orgUid: true },
    });
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    const role = await prisma.organizationRole.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, orgId: true },
    });
    if (!role || role.orgId !== orgId) {
      return { success: false, error: "Role not found in this organization" };
    }

    const existingMember = await prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: user.id },
    });
    if (existingMember) {
      return { success: false, error: "User is already a member of this organization" };
    }

    const isOwnerRole = role.name.toLowerCase() === "owner";

    await prisma.$transaction(async (tx) => {
      // If setting as owner, demote any existing owner to Admin
      if (isOwnerRole) {
        let adminRole = await tx.organizationRole.findFirst({
          where: {
            orgId,
            name: { equals: "Admin", mode: "insensitive" },
          },
        });
        if (!adminRole) {
          adminRole = await tx.organizationRole.create({
            data: { orgId, name: "Admin", description: "Organization Administrator", canAccessDashboard: true, isActive: true },
          });
        }

        const currentOwners = await tx.organizationMember.findMany({
          where: {
            organizationId: orgId,
            OrganizationRole: { name: { equals: "owner", mode: "insensitive" } },
          },
        });

        for (const currentOwner of currentOwners) {
          await tx.organizationMember.update({
            where: { id: currentOwner.id },
            data: { role: adminRole.id },
          });
        }
      }

      await tx.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          role: role.id,
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });

    return { success: true, message: `Member added successfully as ${role.name}` };
  } catch (error: any) {
    console.error("[ADD_ORG_MEMBER_ERROR]", error);
    return { success: false, error: error.message || "Failed to add organization member" };
  }
}

export async function updateOrgMemberRoleForAdminAction({
  orgMemberId,
  roleId,
}: {
  orgMemberId: number;
  roleId: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can update roles" };
    }

    const member = await prisma.organizationMember.findUnique({
      where: { id: orgMemberId },
      include: {
        OrganizationRole: { select: { id: true, name: true } },
      },
    });
    if (!member) {
      return { success: false, error: "Organization member not found" };
    }

    const newRole = await prisma.organizationRole.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, orgId: true },
    });
    if (!newRole || newRole.orgId !== member.organizationId) {
      return { success: false, error: "Selected role not found in this organization" };
    }

    const isNewRoleOwner = newRole.name.toLowerCase() === "owner";

    await prisma.$transaction(async (tx) => {
      if (isNewRoleOwner) {
        let adminRole = await tx.organizationRole.findFirst({
          where: {
            orgId: member.organizationId,
            name: { equals: "Admin", mode: "insensitive" },
          },
        });
        if (!adminRole) {
          adminRole = await tx.organizationRole.create({
            data: {
              orgId: member.organizationId,
              name: "Admin",
              description: "Organization Administrator",
              canAccessDashboard: true,
              isActive: true,
            },
          });
        }

        const otherOwners = await tx.organizationMember.findMany({
          where: {
            organizationId: member.organizationId,
            id: { not: orgMemberId },
            OrganizationRole: { name: { equals: "owner", mode: "insensitive" } },
          },
        });

        for (const currentOwner of otherOwners) {
          await tx.organizationMember.update({
            where: { id: currentOwner.id },
            data: { role: adminRole.id },
          });
        }
      }

      await tx.organizationMember.update({
        where: { id: orgMemberId },
        data: {
          role: newRole.id,
          status: "ACCEPTED",
        },
      });
    });

    return { success: true, message: `Member role updated to ${newRole.name}` };
  } catch (error: any) {
    console.error("[UPDATE_ORG_MEMBER_ROLE_ERROR]", error);
    return { success: false, error: error.message || "Failed to update member role" };
  }
}

export async function removeOrgMemberForAdminAction({
  orgMemberId,
}: {
  orgMemberId: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can remove members" };
    }

    const member = await prisma.organizationMember.findUnique({
      where: { id: orgMemberId },
      include: {
        OrganizationRole: { select: { name: true } },
      },
    });
    if (!member) {
      return { success: false, error: "Organization member not found" };
    }

    if (member.OrganizationRole.name.toLowerCase() === "owner") {
      const otherMembers = await prisma.organizationMember.count({
        where: { organizationId: member.organizationId, id: { not: orgMemberId } },
      });
      if (otherMembers > 0) {
        return {
          success: false,
          error: "Cannot remove the organization owner while other members exist. Please transfer ownership to another member first.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.orgMemberPermission.deleteMany({ where: { orgMemberId } });
      await tx.organizationMember.delete({ where: { id: orgMemberId } });
    });

    return { success: true, message: "Organization member removed successfully" };
  } catch (error: any) {
    console.error("[REMOVE_ORG_MEMBER_ERROR]", error);
    return { success: false, error: error.message || "Failed to remove organization member" };
  }
}
