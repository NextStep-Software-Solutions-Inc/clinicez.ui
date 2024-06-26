"use server";

import prisma from "@lib/prisma";

export const getFileTypesAction = async () => {
  const fileTypes = await prisma.fileType.findMany({
    where: {
      isActive: true
    }
  });
    
  return fileTypes;
}