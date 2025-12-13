"use server";

import "server-only";
import prisma from "@lib/prisma";

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
