"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";
import { hasCodeProperty } from "@/lib/utils";
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import { hasOrgPermissionAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

type CreateOrgRolePayload = {
  orgUid: string;
  name: string;
  description: string;
}

export const createOrganizationRoleAction = withErrorHandling(async (payload: CreateOrgRolePayload) => {

  const session = await sessionCheck();
  const userId = session.user.sub as string;

  const { orgUid, name, description } = payload;

  // Check permissions in parallel
  const [isSuperAdmin, hasPermission] = await Promise.all([
    isSuperAdminAction(),
    hasOrgPermissionAction({
      userId,
      orgUid,
      permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name
    })
  ]);

  if (!isSuperAdmin && !hasPermission) {
    throw new Error("You do not have permission to create organization roles");
  }
  const newOrgRole = await prisma.organizationRole.create({
    data: {
      Organization: {
        connect: {
          orgUid
        }
      },
      name,
      description,
      requirements: [],
    }
  })
  return { message: "Organization role created successfully", data: newOrgRole }

}, async error => {
  if (hasCodeProperty(error) && error.code === "P2002") {
    return "Role with the same name or id already exists"
  }
  return "An error occurred while creating the organization role"
})

export type GetOrganizationRolesFilters = {
  orgUid?: string;
  userId?: string;
}

export type GetOrganizationRoles = Awaited<ReturnType<typeof getOrganizationRolesAction>>
export const getOrganizationRolesAction = withErrorHandling(cache(async (filters: GetOrganizationRolesFilters) => {

  await sessionCheck();

  const { orgUid, userId } = filters || {};

  const roles = await prisma.organizationRole.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      isActive: true,
      ...(userId ? {
        OrganizationMembers: {
          some: {
            User: {
              userId
            }
          }
        }
      } : {}),
      ...(orgUid ? { Organization: { orgUid } } : {})

    },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      requirements: true,
      UserDefaultOrganizationRoles: {
        where: userId ? {
          User: {
            userId
          }
        } : undefined,
        select: {
          id: true,
          roleId: true,
        }
      }
    }
  })


  return { message: "Organization roles fetched successfully", status: true, data: roles };
}))


export const setOrganizationRoleRequirementsAction = withErrorHandling(async (orgRoleId: number, requirements: string[]) => {

  const session = await sessionCheck();
  const userId = session.user.sub as string;

  // Get orgUid from role
  const role = await prisma.organizationRole.findUnique({
    where: { id: orgRoleId },
    select: { Organization: { select: { orgUid: true } } }
  });

  if (!role) throw new Error("Role not found");

  // Check permissions in parallel
  const [isSuperAdmin, hasPermission] = await Promise.all([
    isSuperAdminAction(),
    hasOrgPermissionAction({
      userId,
      orgUid: role.Organization.orgUid,
      permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name
    })
  ]);

  if (!isSuperAdmin && !hasPermission) {
    throw new Error("You do not have permission to update role requirements");
  }

  await prisma.organizationRole.update({
    where: {
      isActive: true,
      id: orgRoleId
    },
    data: { requirements }
  })
  return { message: "Role requirements updated successfully", data: null }

})

export const deleteOrganizationRoleAction = withErrorHandling(async (orgRoleId: number) => {

  const session = await sessionCheck();
  const userId = session.user.sub as string;

  // Get orgUid from role
  const role = await prisma.organizationRole.findUnique({
    where: { id: orgRoleId },
    select: { Organization: { select: { orgUid: true } } }
  });

  if (!role) throw new Error("Role not found");

  // Check permissions in parallel
  const [isSuperAdmin, hasPermission] = await Promise.all([
    isSuperAdminAction(),
    hasOrgPermissionAction({
      userId,
      orgUid: role.Organization.orgUid,
      permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name
    })
  ]);

  if (!isSuperAdmin && !hasPermission) {
    throw new Error("You do not have permission to delete organization roles");
  }

  await prisma.organizationRole.update({
    where: {
      isActive: true,
      id: orgRoleId
    },
    data: { isActive: false }
  })
  return { message: "Role deleted successfully", data: null }

})

export const updateOrganizationRoleAction = withErrorHandling(async (orgRoleId: number, payload: { name: string; description?: string }) => {

  const session = await sessionCheck();
  const userId = session.user.sub as string;

  const role = await prisma.organizationRole.findUnique({
    where: { id: orgRoleId },
    select: { Organization: { select: { orgUid: true } } }
  });

  if (!role) throw new Error("Role not found");

  const [isSuperAdmin, hasPermission] = await Promise.all([
    isSuperAdminAction(),
    hasOrgPermissionAction({
      userId,
      orgUid: role.Organization.orgUid,
      permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name
    })
  ]);

  if (!isSuperAdmin && !hasPermission) {
    throw new Error("You do not have permission to update organization roles");
  }

  await prisma.organizationRole.update({
    where: { isActive: true, id: orgRoleId },
    data: { name: payload.name, description: payload.description }
  });
  return { message: "Role updated successfully", data: null }

}, async error => {
  if (hasCodeProperty(error) && error.code === "P2002") {
    return "Role with the same name already exists"
  }
  return "An error occurred while updating the organization role"
})

/* ──────────────────────────────────────────────────────────────────── */
/*  Get org roles with their initial permission assignments             */
/* ──────────────────────────────────────────────────────────────────── */

export type GetOrganizationRolesWithPermissions = Awaited<ReturnType<typeof getOrganizationRolesWithPermissionsAction>>;
export async function getOrganizationRolesWithPermissionsAction(orgUid: string) {
  const roles = await prisma.organizationRole.findMany({
    where: { isActive: true, Organization: { orgUid } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      requirements: true,
      OrgRoleInitialPermissions: {
        where: { Organization: { orgUid } },
        select: {
          id: true,
          Permission: { select: { id: true, name: true, description: true } },
        },
      },
    },
  });
  return roles;
}
