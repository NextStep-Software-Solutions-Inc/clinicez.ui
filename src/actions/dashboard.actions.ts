"use server";

import prisma from "@lib/prisma";


export const getDashboardData = async (orgUid: string) => {

  const files = await prisma.file.aggregate({
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
  });
  
  const memberships = await prisma.userOrganization.groupBy({
    by: ["status"],
    where: {
      Organization: {
        orgId: orgUid
      },
    },
    _count: true,
  })
  return {
    files,
    memberships
  }
}