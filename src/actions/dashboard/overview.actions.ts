"use server";

import prisma from "@lib/prisma";

export const getDashboardData = async (orgUid: string) => {
  const [files, memberships] = await Promise.all([
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
        _all: true
      },
    })
  ])

  return {
    files,
    memberships
  }
}