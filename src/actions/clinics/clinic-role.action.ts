"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { ClinicMemberStatus } from "@/types";

type CreateClinicRolePayload = {
  name: string;
}

export const createClinicRoleAction = async (payload: CreateClinicRolePayload) => {
  let message = "Clinic role created successfully"
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    const { name } = payload;
    const newClinicRole = await prisma.clinicRole.create({
      data: {
        name,
      }
    })
    return { status: true, message, data: newClinicRole }
  } catch (error) {
    console.error(`Error while creating clinic role: ${error}`);
    message = "Error while creating role";
    if(error instanceof Error) message = error.message;
    return { status: false,  message: "Error while creating role", data: null }
  }
}

type FiltersType = {
    roleName?: string;
  }
  
export type GetClinicRoles = Awaited<ReturnType<typeof getClinicRolesAction>>
export const getClinicRolesAction = cache(async (filter?: FiltersType) => {
  const {roleName} = filter || { status: "ACTIVE"};
  
  const roles = await prisma.clinicRole.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      isActive: true,
      ...(roleName ? { name: roleName } : {}),
    },
    select: {
      id: true,
      name: true,
      ClinicMembers: {
        select: {
          status: true,
          User: {
            select: {
              id: true,
              userId: true,
            }
          }
        }
      },
      UserDefaultClinicRoles: {
    
        select: {
          id: true,
          Clinic: {
            select: {
              clinicUid: true,
            }
          },
          ClinicRole: {
            select: {
              id: true,
              name: true
            }
          },
          User: {
            select: {
              userId: true
            }
          }
        }
      },
      ClinicRoleAppointmentTabs: {
        select: {
          clinicRoleId: true,
          ClinicAppointmentTab: {
            select: {
              id: true,
              AppointmentTab: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      },
    }
  })

  return roles;
})

export const updateClinicRoleAction = async ({ id, name }: { id: number; name: string }) => {
  let message = "Clinic role updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("Session not found");
    const updated = await prisma.clinicRole.update({ where: { id }, data: { name } });
    return { status: true, message, data: updated };
  } catch (error) {
    console.error(`Error while updating clinic role: ${error}`);
    message = "Error while updating role";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export type GetClinicRolesWithPermissions = Awaited<ReturnType<typeof getClinicRolesWithPermissionsAction>>;
export const getClinicRolesWithPermissionsAction = async (clinicUid: string) => {
  const roles = await prisma.clinicRole.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      canAccessDashboard: true,
      restrictToOwnAppointments: true,
      ClinicMembers: {
        where: { isActive: true, Clinic: { clinicUid } },
        select: { id: true },
      },
      ClinicRoleInitialPermissions: {
        where: { Clinic: { clinicUid } },
        select: {
          id: true,
          Permission: { select: { id: true, name: true, description: true } },
        },
      },
      ClinicRoleAppointmentTabs: {
        where: { ClinicAppointmentTab: { Clinic: { clinicUid } } },
        select: {
          id: true,
          ClinicAppointmentTab: {
            select: {
              id: true,
              AppointmentTab: { select: { id: true, name: true, description: true } },
            },
          },
        },
      },
    },
  });
  return roles;
};

export const setClinicRoleDashboardAccessAction = async (clinicRoleId: number, canAccessDashboard: boolean) => {
  let message = "Role dashboard access updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("Session not found");
    await prisma.clinicRole.update({
      where: { isActive: true, id: clinicRoleId },
      data: { canAccessDashboard }
    });
    return { status: true, message, data: null };
  } catch (error) {
    console.error(`Error while updating clinic role dashboard access: ${error}`);
    message = "Error while updating role dashboard access";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const setClinicRoleRestrictToOwnAppointmentsAction = async (clinicRoleId: number, restrictToOwnAppointments: boolean) => {
  let message = "Role appointment restriction updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("Session not found");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canUpdateSettings = myPermissionArray.includes(PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name);
    if (!canUpdateSettings) throw new Error("You do not have permission to update this setting.");

    await prisma.clinicRole.update({
      where: { isActive: true, id: clinicRoleId },
      data: { restrictToOwnAppointments }
    });
    return { status: true, message, data: null };
  } catch (error) {
    console.error(`Error while updating clinic role appointment restriction: ${error}`);
    message = "Error while updating role appointment restriction";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const deleteClinicRoleAction = async (clinicRoleId: number) => {

  let message = "Clinic role deleted successfully"

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    await prisma.clinicRole.update({
      where: {
        isActive: true,
        id: clinicRoleId
      },
      data: { isActive: false, deletedAt: new Date() }
    })
    return { status: true,  }
  } catch (error) {
    console.error(`Error while deleting role: ${error}`);
    message = "Error while deleting role";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}