"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";
import { getCachedSession } from "@actions/session.action";

export type GetAllTenants = Awaited<ReturnType<typeof getAllTenantsAction>>;
export async function getAllTenantsAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { tenantUid: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      select: {
        id: true,
        tenantUid: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        Owner: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            Organizations: true,
            Clinics: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    data: tenants,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type GetTenantOrganizations = Awaited<
  ReturnType<typeof getTenantOrganizationsAction>
>;
export async function getTenantOrganizationsAction({
  tenantId,
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  tenantId: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  const where = {
    tenantId,
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { orgUid: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        id: true,
        orgUid: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            OrganizationMembers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    data: organizations,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type GetTenantClinics = Awaited<ReturnType<typeof getTenantClinicsAction>>;
export async function getTenantClinicsAction({
  tenantId,
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  tenantId: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  const where = {
    tenantId,
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { clinicUid: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      select: {
        id: true,
        clinicUid: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            ClinicMembers: true,
            ClinicPatients: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.clinic.count({ where }),
  ]);

  return {
    data: clinics,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateTenantAction({
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
  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return { data: tenant };
}

export async function getTenantByIdAction({
  tenantId,
}: {
  tenantId: number;
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      tenantUid: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      Owner: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          Organizations: true,
          Clinics: true,
        },
      },
    },
  });

  return tenant;
}

export async function createTenantAction(payload: {
  tenantUid: string;
  name: string;
  description?: string;
  ownerEmail?: string;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can perform this action");

    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized: User not authenticated");

    const creatorUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
    });
    if (!creatorUser) throw new Error("Authenticated user not found in database.");

    const { tenantUid, name, description, ownerEmail } = payload;
    if (!tenantUid?.trim() || !name?.trim()) {
      throw new Error("Tenant UID and Name are required.");
    }

    const trimmedUid = tenantUid.trim();
    const trimmedName = name.trim();

    // Check if tenant UID already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { tenantUid: trimmedUid },
    });
    if (existingTenant) {
      throw new Error(`Tenant UID "${trimmedUid}" is already taken.`);
    }

    // Determine owner: specified user or creator user
    let ownerUser = creatorUser;
    if (ownerEmail?.trim()) {
      const foundUser = await prisma.user.findFirst({
        where: { email: ownerEmail.trim(), isActive: true },
      });
      if (!foundUser) {
        throw new Error(`Owner user with email "${ownerEmail.trim()}" not found or is inactive.`);
      }
      ownerUser = foundUser;
    }

    const tenant = await prisma.tenant.create({
      data: {
        tenantUid: trimmedUid,
        name: trimmedName,
        description: description?.trim() || null,
        ownerId: ownerUser.id,
        isActive: true,
      },
      include: {
        Owner: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return { success: true, data: tenant };
  } catch (error: any) {
    console.error("Create Tenant Error:", error);
    return { success: false, error: error.message || "Failed to create tenant" };
  }
}
