"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetClinicById = Awaited<ReturnType<typeof getClinicByIdAction>>;
export async function getClinicByIdAction({
  clinicId,
}: {
  clinicId: number;
}) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      clinicUid: true,
      name: true,
      description: true,
      logo: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      isActive: true,
      Tenant: {
        select: {
          id: true,
          tenantUid: true,
          name: true,
        },
      },
      _count: {
        select: {
          ClinicMembers: true,
          ClinicPatients: true,
          ClinicAppointmentTabs: true,
        },
      },
    },
  });

  return clinic;
}

export type GetClinicRoles = Awaited<ReturnType<typeof getClinicRolesAction>>;
export async function getClinicRolesAction({
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
            ClinicRoleAppointmentTabs: true,
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
  };
}

export type GetClinicAppointmentTabs = Awaited<
  ReturnType<typeof getClinicAppointmentTabsAction>
>;
export async function getClinicAppointmentTabsAction({
  clinicId,
}: {
  clinicId: number;
}) {
  const [clinicAppointmentTabs, allAppointmentTabs] = await Promise.all([
    prisma.clinicAppointmentTab.findMany({
      where: {
        clinicId,
      },
      select: {
        id: true,
        appointmentTabId: true,
        AppointmentTab: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
        ClinicRoleAppointmentTabs: {
          select: {
            id: true,
            clinicRoleId: true,
            ClinicRole: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.appointmentTab.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    clinicAppointmentTabs,
    allAppointmentTabs,
  };
}

export async function updateClinicAppointmentTabsAction({
  clinicId,
  appointmentTabIds,
}: {
  clinicId: number;
  appointmentTabIds: number[];
}) {
  await prisma.$transaction(async (tx) => {
    // Delete existing clinic appointment tabs and their role assignments
    await tx.clinicRoleAppointmentTab.deleteMany({
      where: {
        ClinicAppointmentTab: {
          clinicId,
        },
      },
    });

    await tx.clinicAppointmentTab.deleteMany({
      where: {
        clinicId,
      },
    });

    // Create new clinic appointment tabs
    await tx.clinicAppointmentTab.createMany({
      skipDuplicates: true,
      data: appointmentTabIds.map((appointmentTabId) => ({
        clinicId,
        appointmentTabId,
      })),
    });
  });

  return { success: true };
}
