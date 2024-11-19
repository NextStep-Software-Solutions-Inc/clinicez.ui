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
      validUntil: true,
    }
    
  });
    
  return fileTypes;
}