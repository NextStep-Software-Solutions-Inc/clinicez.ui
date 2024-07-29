"use server";

import prisma from "@lib/prisma-common";

export const getDashboardData = async (orgUid: string) => {
  const [files, memberships, members, roles] = await Promise.all([
    prisma.file.aggregate({
      where: {
        isActive: true,
        FileType: {
          FileTypeAttribute: {
            Organization: {
              orgId: orgUid
            } 
          }
        }
      },
      _count: true,
      _sum: {
        size: true
      }
    }),
    prisma.userOrganization.groupBy({
      by: ["status"],
      where: {
        Organization: {
          orgId: orgUid
        },
      },
      _count: {
        status: true,
        role: true,
        _all: true
      },
    }),
    prisma.user.count({
      where: {
        Organizations: {
          some: {
            Organization: {
              orgId: orgUid
            }
          }
        }
      },
    }),
    prisma.userOrganizationRole.findMany({
      orderBy: {
        name: "asc"
      },
      where: {
        Organization: {
          orgId: orgUid
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            UserOrganizations: {
              where: {
                Organization: {
                  orgId: orgUid
                }
              }
            }
          }
        }
      }
    }),
  ])
  return {
    files,
    memberships,
    members,
    roles
  }
}