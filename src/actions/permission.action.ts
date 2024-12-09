"use server";

import "server-only";
import prisma from "@lib/prisma";
import { PermissionType } from "@/types";

export type GetPermissions = Awaited<ReturnType<typeof getPermissionsAction>>;
export async function getPermissionsAction({userId, type}: {userId?: string, type?: PermissionType}) {

  const permissions = await prisma.permission.findMany({
    where: {
      isActive: true,
      ...type ? { type } : {},
      ...userId ? {
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
      } : {},
    }, 
    select: {
      id: true,
      name: true,
      description: true,
    }
  })
  return permissions;
}
