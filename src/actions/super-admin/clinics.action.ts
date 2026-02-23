"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

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

export type GetClinicMembersForAdmin = Awaited<ReturnType<typeof getClinicMembersForAdminAction>>;
export async function getClinicMembersForAdminAction({
  clinicId,
  search,
  cursor,
  take = 20,
}: {
  clinicId: number;
  search?: string;
  cursor?: number;
  take?: number;
}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }

  const where = {
    clinicId,
    deletedAt: null,
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

  const members = await prisma.clinicMember.findMany({
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
      Role: {
        select: {
          id: true,
          name: true,
        },
      },
      ClinicMemberPermissions: {
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

export async function getClinicMemberPermissionsForAdminAction(clinicMemberId: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }

  const permissions = await prisma.clinicMemberPermission.findMany({
    where: { clinicMemberId },
    select: { permissionId: true },
  });
  return { data: permissions };
}

export async function setClinicMemberPermissionsForAdminAction({
  clinicMemberId,
  permissionIds,
}: {
  clinicMemberId: number;
  permissionIds: number[];
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can update permissions" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId } });
      if (permissionIds.length > 0) {
        await tx.clinicMemberPermission.createMany({
          skipDuplicates: true,
          data: permissionIds.map((permissionId) => ({ clinicMemberId, permissionId })),
        });
      }
    });
    return { success: true, message: "Permissions updated successfully" };
  } catch (error) {
    console.error("[SET_CLINIC_MEMBER_PERMISSIONS_ERROR]", error);
    return { success: false, error: "Failed to update permissions" };
  }
}

export type GetClinicPatientsForAdmin = Awaited<ReturnType<typeof getClinicPatientsForAdminAction>>;
export async function getClinicPatientsForAdminAction({
  clinicId,
  search,
  cursor,
  take = 20,
}: {
  clinicId: number;
  search?: string;
  cursor?: number;
  take?: number;
}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }

  const where = {
    clinicId,
    deletedAt: null,
    ...(search
      ? {
        Patient: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }
      : {}),
  };

  const patients = await prisma.clinicPatient.findMany({
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
    select: {
      id: true,
      isActive: true,
      onboardingStatus: true,
      createdAt: true,
      Patient: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      ClinicPatientPermissions: {
        select: {
          permissionId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const hasMore = patients.length > take;
  const data = hasMore ? patients.slice(0, take) : patients;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, hasMore, nextCursor };
}

export async function getClinicPatientPermissionsForAdminAction(clinicPatientId: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }

  const permissions = await prisma.clinicPatientPermission.findMany({
    where: { clinicPatientId },
    select: { permissionId: true },
  });
  return { data: permissions };
}

export async function setClinicPatientPermissionsForAdminAction({
  clinicPatientId,
  permissionIds,
}: {
  clinicPatientId: number;
  permissionIds: number[];
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can update permissions" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.clinicPatientPermission.deleteMany({ where: { clinicPatientId } });
      if (permissionIds.length > 0) {
        await tx.clinicPatientPermission.createMany({
          skipDuplicates: true,
          data: permissionIds.map((permissionId) => ({ clinicPatientId, permissionId })),
        });
      }
    });
    return { success: true, message: "Patient permissions updated successfully" };
  } catch (error) {
    console.error("[SET_CLINIC_PATIENT_PERMISSIONS_ERROR]", error);
    return { success: false, error: "Failed to update patient permissions" };
  }
}
