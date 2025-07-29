"use server";

import prisma from "@lib/prisma";

export const getDashboardData = async (clinicUid: string) => {
  const [files, memberships, members, roles] = await Promise.all([

    prisma.file.aggregate({
      where: {
        isActive: true,
        Folder: {
          isActive: true,
          User: {
            OrganizationMembers: {
              some: {
                Organization: {
                  orgUid: clinicUid
                }
              }
            }
          }
        }
      },
      _count: true,
      _sum: {
        size: true
      }
    }),

    prisma.organizationMember.groupBy({
      by: ["status"],
      where: {
        Organization: {
          isActive: true,
          orgUid: clinicUid,
        },
      },
      _count: {
        status: true,
        _all: true
      },
    }),

    prisma.user.count({
      where: {
        OrganizationMembers: {
          some: {
            Organization: {
              isActive: true,
              orgUid: clinicUid,
            },
          },
        },
      },
    }),

    prisma.organizationRole.findMany({
      orderBy: {
        name: "asc"
      },
      where: {
        Organization: {
          isActive: true,
          orgUid: clinicUid,
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            OrganizationMembers: {
              where: {
                Organization: {
                  orgUid: clinicUid,
                },
              },
            },
          },
        },
      },
    }),
  ])
  
  return {
    files,
    memberships,
    members,
    roles
  }
}