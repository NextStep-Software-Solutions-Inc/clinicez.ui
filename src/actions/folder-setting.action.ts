"use server";

import prisma from "@lib/prisma-common";

export const updateFolderSettingAction = async (folderId: number, isPublic: boolean) => {
  const folderSetting = await prisma.folderSetting.update({
    where: { folderId },
    data: { isPublic }
  });
    
  return folderSetting;
}