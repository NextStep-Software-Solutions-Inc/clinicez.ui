"use server";

import prisma from "@lib/prisma";


export const getDashboardData = async (userId: string) => {

  const files = await prisma.file.aggregate({
    where: {
      isActive: true,
      Folder: {
        User: {
          userId
        },
      },
      FileType: {
        FileTypeAttribute: {
          scopeOrgId: 1
        }
      }
    },
    _count: true,
    _sum: {
      size: true
    }
  });
  
  const memberships = await prisma.userOrganization.groupBy({
    by: ["status"],
    where: {
      Organization: {
        orgId: "ustp-hims"
      },
    },
    _count: true,
  })
  return {
    files,
    memberships
  }
}