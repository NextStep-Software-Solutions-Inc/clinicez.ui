"use server";

import prisma from "@lib/prisma";

export type GetFileTypes = Awaited<ReturnType<typeof getFileTypesAction>>
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
          dateTakenRequired: true,
          required: true,
          Clinic: {
            select: {
              id: true,
              clinicUid: true
            }
          }
        }
      }
    }
    
  });
    
  return fileTypes;
}