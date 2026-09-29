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

export async function getAllClinicRolesAction() {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only super admins can access this resource");
  }
  const roles = await prisma.clinicRole.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      canAccessDashboard: true,
    },
    orderBy: { name: "asc" },
  });
  return roles;
}

export async function addClinicMemberForAdminAction({
  clinicId,
  userEmail,
  roleId,
}: {
  clinicId: number;
  userEmail: string;
  roleId: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can perform this action" };
    }

    if (!userEmail?.trim()) {
      return { success: false, error: "User email is required" };
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail.trim().toLowerCase() },
    });
    if (!user) {
      return { success: false, error: `User with email "${userEmail}" not found` };
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, clinicUid: true },
    });
    if (!clinic) {
      return { success: false, error: "Clinic not found" };
    }

    const role = await prisma.clinicRole.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });
    if (!role) {
      return { success: false, error: "Role not found" };
    }

    const existingMember = await prisma.clinicMember.findFirst({
      where: { clinicId, userId: user.id, deletedAt: null },
    });
    if (existingMember) {
      return { success: false, error: "User is already a member of this clinic" };
    }

    const isOwnerRole = role.name.toLowerCase() === "owner";

    await prisma.$transaction(async (tx) => {
      // If setting as owner, demote existing owner to Admin
      if (isOwnerRole) {
        let adminRole = await tx.clinicRole.findFirst({
          where: { name: { equals: "Admin", mode: "insensitive" } },
        });
        if (!adminRole) {
          adminRole = await tx.clinicRole.create({
            data: { name: "Admin", canAccessDashboard: true, isActive: true },
          });
        }

        const currentOwners = await tx.clinicMember.findMany({
          where: {
            clinicId,
            deletedAt: null,
            Role: { name: { equals: "owner", mode: "insensitive" } },
          },
        });

        for (const currentOwner of currentOwners) {
          await tx.clinicMember.update({
            where: { id: currentOwner.id },
            data: { roleId: adminRole.id },
          });
        }
      }

      // Create new clinic member
      const newMember = await tx.clinicMember.create({
        data: {
          clinicId,
          userId: user.id,
          roleId: role.id,
          status: "ACTIVE",
          isActive: true,
        },
      });

      // Copy initial permissions from ClinicRoleInitialPermission if configured
      const initialPermissions = await tx.clinicRoleInitialPermission.findMany({
        where: {
          clinicId,
          clinicRoleId: role.id,
          Permission: { isActive: true },
        },
        select: { permissionId: true },
      });

      if (initialPermissions.length > 0) {
        await tx.clinicMemberPermission.createMany({
          skipDuplicates: true,
          data: initialPermissions.map((p) => ({
            clinicMemberId: newMember.id,
            permissionId: p.permissionId,
          })),
        });
      }
    });

    return { success: true, message: `Member added successfully as ${role.name}` };
  } catch (error: any) {
    console.error("[ADD_CLINIC_MEMBER_ERROR]", error);
    return { success: false, error: error.message || "Failed to add clinic member" };
  }
}

export async function updateClinicMemberRoleForAdminAction({
  clinicMemberId,
  roleId,
}: {
  clinicMemberId: number;
  roleId: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can update roles" };
    }

    const member = await prisma.clinicMember.findUnique({
      where: { id: clinicMemberId },
      include: {
        Role: { select: { id: true, name: true } },
        Clinic: { select: { id: true, clinicUid: true } },
      },
    });
    if (!member) {
      return { success: false, error: "Clinic member not found" };
    }

    const newRole = await prisma.clinicRole.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });
    if (!newRole) {
      return { success: false, error: "Selected role not found" };
    }

    const isNewRoleOwner = newRole.name.toLowerCase() === "owner";

    await prisma.$transaction(async (tx) => {
      // If promoting to owner, demote any other current active owner to Admin
      if (isNewRoleOwner) {
        let adminRole = await tx.clinicRole.findFirst({
          where: { name: { equals: "Admin", mode: "insensitive" } },
        });
        if (!adminRole) {
          adminRole = await tx.clinicRole.create({
            data: { name: "Admin", canAccessDashboard: true, isActive: true },
          });
        }

        const otherOwners = await tx.clinicMember.findMany({
          where: {
            clinicId: member.clinicId,
            id: { not: clinicMemberId },
            deletedAt: null,
            Role: { name: { equals: "owner", mode: "insensitive" } },
          },
        });

        for (const currentOwner of otherOwners) {
          await tx.clinicMember.update({
            where: { id: currentOwner.id },
            data: { roleId: adminRole.id },
          });
        }
      }

      await tx.clinicMember.update({
        where: { id: clinicMemberId },
        data: {
          roleId: newRole.id,
          status: "ACTIVE",
          isActive: true,
        },
      });

      // Merge new role initial permissions
      const initialPermissions = await tx.clinicRoleInitialPermission.findMany({
        where: {
          clinicId: member.clinicId,
          clinicRoleId: newRole.id,
          Permission: { isActive: true },
        },
        select: { permissionId: true },
      });

      if (initialPermissions.length > 0) {
        await tx.clinicMemberPermission.createMany({
          skipDuplicates: true,
          data: initialPermissions.map((p) => ({
            clinicMemberId,
            permissionId: p.permissionId,
          })),
        });
      }
    });

    return { success: true, message: `Member role updated to ${newRole.name}` };
  } catch (error: any) {
    console.error("[UPDATE_CLINIC_MEMBER_ROLE_ERROR]", error);
    return { success: false, error: error.message || "Failed to update member role" };
  }
}

export async function removeClinicMemberForAdminAction({
  clinicMemberId,
}: {
  clinicMemberId: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can remove members" };
    }

    const member = await prisma.clinicMember.findUnique({
      where: { id: clinicMemberId },
      include: {
        Role: { select: { name: true } },
      },
    });
    if (!member) {
      return { success: false, error: "Clinic member not found" };
    }

    if (member.Role.name.toLowerCase() === "owner") {
      const otherMembers = await prisma.clinicMember.count({
        where: { clinicId: member.clinicId, id: { not: clinicMemberId }, deletedAt: null },
      });
      if (otherMembers > 0) {
        return {
          success: false,
          error: "Cannot remove the clinic owner while other members exist. Please transfer ownership to another member first.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId } });
      await tx.clinicMember.delete({ where: { id: clinicMemberId } });
    });

    return { success: true, message: "Clinic member removed successfully" };
  } catch (error: any) {
    console.error("[REMOVE_CLINIC_MEMBER_ERROR]", error);
    return { success: false, error: error.message || "Failed to remove clinic member" };
  }
}
