"use server";

import "server-only";
import prisma from "@lib/prisma"
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { hasCodeProperty } from "@/lib/utils";
import { sessionCheck } from "@/lib/auth";

export const isClinicHealthcareProviderAction = async (userId: string, clinicUid: string) => {
  const member = await prisma.clinicMember.findFirst({
    where: {
      User: {
        userId
      },
      Clinic: {
        clinicUid
      },
      isActive: true,
      deletedAt: null,
    }
  });

  return !!member;
}

export type GetClinicMembersFilters = {
  clinicUid: string;
  roleName?: string;
  status?: string;
  userId?: string;
}
export type GetClinicMembers = Awaited<ReturnType<typeof getClinicMembersAction>>;
export const getClinicMembersAction = withErrorHandling(async (filters: GetClinicMembersFilters) => {

  const session = await getCachedSession()
  if (!session) throw new Error("User not authenticated")

  const { clinicUid, roleName, status, userId } = filters;
  const members = await prisma.clinicMember.findMany({
    orderBy: {
      createdAt: "asc"
    },
    where: {
      Clinic: {
        clinicUid
      },
      Role: {
        name: roleName
      },
      status,
      User: {
        userId
      }
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      roleId: true,
      Role: {
        select: {
          name: true
        }
      },
      User: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          suffix: true,
          picture: true
        }
      }
    }
  });
  return { message: "Successfully fetched clinic members.", data: members }
})


export const suspendClinicMemberAction = withErrorHandling(async (clinicMemberId: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("User not authenticated")

  try {
    await prisma.clinicMember.update({
      where: {
        id: clinicMemberId
      },
      data: {
        status: "SUSPENDED",
      }
    })

    return { message: "Successfully suspended clinic member.", data: null }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2003") {
      throw new Error("Cannot be remove due to existing dependencies.")
    }
    throw new Error("An error occurred while suspending the clinic member.")
  }
});

export const removeClinicMemberAction = withErrorHandling(async (clinicMemberId: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("User not authenticated")

  try {
    await prisma.clinicMember.delete({
      where: {
        id: clinicMemberId,
        Role: {
          name: {
            not: "owner"
          }
        }
      }
    })

    return { message: "Successfully deleted clinic member.", data: null }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2003") throw new Error("Cannot be delete due to existing dependencies.")
    if (hasCodeProperty(error) && error.code === "P2025") throw new Error("An error occurred while deleted the clinic member. owner cannot be deleted.")
    throw new Error("An error occurred while deleted the clinic member.")
  }
});

export const updateClinicMemberRoleAction = withErrorHandling(async (clinicMemberId: number, roleId: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("User not authenticated")

  try {
    if (!Number.isInteger(roleId) || roleId <= 0) {
      throw new Error("Invalid role.")
    }

    const clinicMember = await prisma.clinicMember.findUnique({
      where: { id: clinicMemberId },
      select: {
        clinicId: true,
        roleId: true,
        Role: {
          select: { name: true }
        }
      }
    })

    if (!clinicMember) throw new Error("Clinic member not found.")
    if (clinicMember.Role?.name === "owner") throw new Error("Owner role cannot be updated.")

    // Update role and preserve custom permissions in a transaction
    await prisma.$transaction(async (prisma) => {
      // Get old role's initial permissions
      const oldRolePermissions = await prisma.clinicRoleInitialPermission.findMany({
        where: {
          clinicId: clinicMember.clinicId,
          clinicRoleId: clinicMember.roleId,
        },
        select: {
          permissionId: true,
        }
      });
      const oldRolePermissionIds = new Set(oldRolePermissions.map(p => p.permissionId));

      // Get current member's permissions
      const currentPermissions = await prisma.clinicMemberPermission.findMany({
        where: { clinicMemberId },
        select: {
          permissionId: true,
        }
      });
      const currentPermissionIds = new Set(currentPermissions.map(p => p.permissionId));

      // Calculate custom permissions (granted manually, not from role)
      const customPermissionIds = Array.from(currentPermissionIds).filter(
        permId => !oldRolePermissionIds.has(permId)
      );

      // Get new role's initial permissions
      const newRolePermissions = await prisma.clinicRoleInitialPermission.findMany({
        where: {
          clinicId: clinicMember.clinicId,
          clinicRoleId: roleId,
          ClinicRole: {
            isActive: true,
          },
          Permission: { isActive: true }
        },
        select: {
          permissionId: true,
        }
      });

      // Combine new role permissions with custom permissions (preserve customizations)
      const allPermissionIds = new Set([
        ...newRolePermissions.map(p => p.permissionId),
        ...customPermissionIds
      ]);

      // Update the role
      await prisma.clinicMember.update({
        where: {
          id: clinicMemberId
        },
        data: {
          Role: {
            connect: {
              id: roleId
            }
          }
        }
      });

      // Replace all permissions with new role + custom permissions
      await prisma.clinicMemberPermission.deleteMany({
        where: { clinicMemberId }
      });

      if (allPermissionIds.size > 0) {
        await prisma.clinicMemberPermission.createMany({
          skipDuplicates: true,
          data: Array.from(allPermissionIds).map(permissionId => ({
            clinicMemberId: clinicMemberId,
            permissionId: permissionId
          }))
        });
      }
    });

    return { message: "Successfully updated clinic member role and preserved custom permissions.", data: null }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2025") throw new Error("Role not found.")
    throw new Error("An error occurred while updating the clinic member role.")
  }
})

type AddClinicMemberPayload = {
  clinicUid: string;
  userId: string;
  roleId: number;
}
export const addClinicMemberAction = withErrorHandling(async (payload: AddClinicMemberPayload) => {

  await sessionCheck()
  const { clinicUid, userId, roleId } = payload;

  try {
    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      const initialPermissions = await prisma.clinicRoleInitialPermission.findMany({
        where: {
          Clinic: {
            clinicUid
          },
          ClinicRole: {
            id: roleId,
            isActive: true,
          },
          Permission: { isActive: true }
        },
        select: {
          id: true,
          permissionId: true,
        }
      });

      const createdMember = await prisma.clinicMember.create({
        data: {
          status: "ACTIVE",
          Clinic: {
            connect: {
              clinicUid
            }
          },
          User: {
            connect: {
              userId
            }
          },
          Role: {
            connect: {
              id: roleId
            }
          },
        }
      });

      await prisma.clinicMemberPermission.createMany({
        skipDuplicates: true,
        data: initialPermissions.map(permission => ({
          clinicMemberId: createdMember.id,
          permissionId: permission.permissionId
        }))
      });

      return createdMember;
    });

    return { message: "Successfully added clinic member.", data: null }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2002") throw new Error("User already a member of the clinic.")
    throw new Error("An error occurred while adding the clinic member.")
  }
})
