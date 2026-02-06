"use server";

import "server-only";
import prisma from "@lib/prisma";
import { PermissionType } from "@/types";

export type GetPermissions = Awaited<ReturnType<typeof getPermissionsAction>>;
export async function getPermissionsAction({ userId, type }: { userId?: string, type?: PermissionType }) {

  const permissions = await prisma.permission.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
      ...(userId ? {
        OR: [
          {
            OrgMemberPermissions: {
              some: {
                OrganizationMember: {
                  User: {
                    userId
                  }
                }
              }
            }
          },
          {
            ClinicMemberPermissions: {
              some: {
                ClinicMember: {
                  User: {
                    userId
                  }
                }
              }
            }
          },
          {
            ClinicPatientPermissions: {
              some: {
                ClinicPatient: {
                  Patient: {
                    userId
                  }
                }
              }
            }
          },
          {
            UserPermissions: {
              some: {
                User: {
                  userId
                }
              }
            }
          }
        ]
      } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
    }
  })
  return permissions;
}

export async function hasOrgPermissionAction({ userId, orgUid, permissionName }: { userId: string, orgUid: string, permissionName: string }) {
  try {
    const permission = await prisma.permission.findFirst({
      where: {
        name: permissionName,
        isActive: true,
        OrgMemberPermissions: {
          some: {
            OrganizationMember: {
              User: {
                userId
              },
              Organization: {
                orgUid
              },
              status: "ACTIVE"
            }
          }
        }
      }
    });

    return !!permission;
  } catch (error) {
    console.error("Error checking organization permission:", error);
    return false;
  }
}

export async function hasClinicPermissionAction({ userId, clinicUid, permissionName }: { userId: string, clinicUid: string, permissionName: string }) {
  try {
    const permission = await prisma.permission.findFirst({
      where: {
        name: permissionName,
        isActive: true,
        ClinicMemberPermissions: {
          some: {
            ClinicMember: {
              User: {
                userId
              },
              Clinic: {
                clinicUid
              },
              status: "ACTIVE"
            }
          }
        }
      }
    });

    return !!permission;
  } catch (error) {
    console.error("Error checking clinic permission:", error);
    return false;
  }
}
