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
      Role: roleName
        ? {
            name: { equals: roleName, mode: "insensitive" },
          }
        : undefined,
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
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          suffix: true,
          picture: true
        }
      },
      ClinicMemberPermissions: {
        select: {
          permissionId: true
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

export const updateClinicMemberRoleAction = withErrorHandling(async (
  clinicMemberId: number,
  roleId: number,
  permissionMode: "replace" | "merge" = "replace",
) => {

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
    if (clinicMember.Role?.name?.toLowerCase() === "owner") throw new Error("Owner role cannot be updated.")

    await prisma.$transaction(async (tx) => {
      // Get new role's initial permissions
      const newRolePermissions = await tx.clinicRoleInitialPermission.findMany({
        where: {
          clinicId: clinicMember.clinicId,
          clinicRoleId: roleId,
          ClinicRole: { isActive: true },
          Permission: { isActive: true },
        },
        select: { permissionId: true },
      });

      // Update the role first
      await tx.clinicMember.update({
        where: { id: clinicMemberId },
        data: { Role: { connect: { id: roleId } } },
      });

      if (permissionMode === "replace") {
        // Clear all existing permissions and apply only the new role's initial permissions
        await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId } });
        if (newRolePermissions.length > 0) {
          await tx.clinicMemberPermission.createMany({
            skipDuplicates: true,
            data: newRolePermissions.map(p => ({ clinicMemberId, permissionId: p.permissionId })),
          });
        }
      } else {
        // Merge: keep all existing permissions and add the new role's initial permissions on top
        await tx.clinicMemberPermission.createMany({
          skipDuplicates: true,
          data: newRolePermissions.map(p => ({ clinicMemberId, permissionId: p.permissionId })),
        });
      }
    });

    const modeLabel = permissionMode === "replace" ? "replaced" : "merged";
    return { message: `Successfully updated clinic member role. Permissions ${modeLabel}.`, data: null }
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2025") throw new Error("Role not found.")
    throw new Error("An error occurred while updating the clinic member role.")
  }
})

export const resetClinicMemberPermissionsAction = withErrorHandling(async (clinicMemberId: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  try {
    const clinicMember = await prisma.clinicMember.findUnique({
      where: { id: clinicMemberId },
      select: {
        clinicId: true,
        roleId: true,
        Role: { select: { name: true } },
      },
    });

    if (!clinicMember) throw new Error("Clinic member not found.");
    if (clinicMember.Role?.name?.toLowerCase() === "owner") throw new Error("Owner permissions cannot be reset.");

    await prisma.$transaction(async (tx) => {
      const initialPermissions = await tx.clinicRoleInitialPermission.findMany({
        where: {
          clinicId: clinicMember.clinicId,
          clinicRoleId: clinicMember.roleId,
          ClinicRole: { isActive: true },
          Permission: { isActive: true },
        },
        select: { permissionId: true },
      });

      await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId } });

      if (initialPermissions.length > 0) {
        await tx.clinicMemberPermission.createMany({
          skipDuplicates: true,
          data: initialPermissions.map((p) => ({ clinicMemberId, permissionId: p.permissionId })),
        });
      }

      return initialPermissions.map((p) => p.permissionId);
    });

    const restoredPermissions = await prisma.clinicMemberPermission.findMany({
      where: { clinicMemberId },
      select: { permissionId: true },
    });

    return {
      message: "Permissions have been restored to the role defaults.",
      data: restoredPermissions.map((p) => p.permissionId),
    };
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2025") throw new Error("Member not found.");
    throw new Error("An error occurred while resetting the member permissions.");
  }
});

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
      // Enforce: only one owner per clinic
      const roleRecord = await prisma.clinicRole.findUnique({
        where: { id: roleId },
        select: { name: true },
      });
      if (roleRecord?.name?.toLowerCase() === "owner") {
        const existingOwner = await prisma.clinicMember.findFirst({
          where: {
            Clinic: { clinicUid },
            Role: { name: { equals: "owner", mode: "insensitive" } },
            isActive: true,
          },
        });
        if (existingOwner) throw new Error("This clinic already has an owner.");
      }

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

/**
 * Returns the appointment tab names visible to the current user based on their
 * clinic role's ClinicRoleAppointmentTab configuration.
 * Returns null when the user has no membership record (fallback: show all tabs).
 * Returns an empty array when the role has no tabs configured (also: show all tabs).
 */
export type GetCurrentMemberVisibleTabs = Awaited<ReturnType<typeof getCurrentMemberVisibleTabsAction>>;
export const getCurrentMemberVisibleTabsAction = async (clinicUid: string): Promise<string[] | null> => {
  try {
    const session = await getCachedSession();
    if (!session) return null;

    const member = await prisma.clinicMember.findFirst({
      where: {
        User: { userId: session.user.sub },
        Clinic: { clinicUid },
        isActive: true,
        deletedAt: null,
      },
      select: {
        roleId: true,
        Role: {
          select: {
            ClinicRoleAppointmentTabs: {
              where: {
                ClinicAppointmentTab: {
                  Clinic: { clinicUid },
                },
              },
              select: {
                ClinicAppointmentTab: {
                  select: {
                    AppointmentTab: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!member) return null;

    const tabs = member.Role?.ClinicRoleAppointmentTabs ?? [];
    // When zero tabs are assigned to the role it means the admin has not yet
    // configured any restrictions for this role → treat as "unrestricted" and
    // show all status tabs (same as null).  A role can be explicitly restricted
    // to zero tabs only if the Roles settings tab explicitly removes all tabs, but
    // even then the UI always injects "ALL" on the client, so users are never
    // locked out entirely.
    if (tabs.length === 0) return null;

    return tabs.map((t) => t.ClinicAppointmentTab.AppointmentTab.name.toUpperCase());
  } catch {
    return null; // fallback: show all tabs
  }
};

export type SearchNonMembers = Awaited<ReturnType<typeof searchNonMembersAction>>;
export const searchNonMembersAction = withErrorHandling(async (clinicUid: string, query: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  if (!query || query.trim().length < 2) {
    return { message: "Query too short", data: [] };
  }

  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { lastName: "asc" },
    where: {
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      NOT: {
        ClinicMembers: {
          some: {
            Clinic: { clinicUid },
            isActive: true,
            deletedAt: null,
          },
        },
      },
    },
    select: {
      userId: true,
      email: true,
      firstName: true,
      lastName: true,
      middleName: true,
      picture: true,
    },
  });

  return { message: "Users found", data: users };
});
