"use server";

import prisma from "@lib/prisma";

export const updateFileSettingAction = async (fileId: number, isPublic: boolean) => {
  const folderSetting = await prisma.fileSetting.update({
    where: { fileId },
    data: { isPublic }
  });
    
  return folderSetting;
}