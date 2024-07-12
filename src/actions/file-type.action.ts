"use server";

import prisma from "@lib/prisma";

export const getFileTypesAction = async () => {
  const fileTypes = await prisma.fileType.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      FileTypeAttribute: {
        select: {
          Organization: {
            select: {
              orgId: true
            }
          }
        }
      }
    }
    
  });
    
  return fileTypes;
}