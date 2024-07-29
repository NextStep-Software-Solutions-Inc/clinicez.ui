"use server";

import prisma from "@lib/prisma-common";
import { revalidatePath } from "next/cache";

export const createFolderAction = async (name: string, userId: string) => {
  const folder = await prisma.folder.create({
    data: {
      name,
      User: {
        connect: {
          userId
        }
      },
      FolderSetting: {
        create: {
          isPublic: true
        }
      }
    }
  });
    
  revalidatePath('/', "page");
  return folder;
}

export const getFoldersAction = async (userId: string) => {
  const folders = await prisma.folder.findMany({
    where: {
      isActive: true,
      User: {
        userId
      }
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      Files: {
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          url: true,
          size: true,
          dateTaken: true,
          FileType: {
            select: {
              name: true,
              FileTypeAttribute: {
                select: {
                  required: true,
                  validUntil: true,
                  scopeOrgId: true
                }
              }
            }
          },
          FileSetting: {
            select: {
              isPublic: true
            }
          }
        }
      },
      FolderSetting: {
        select: {
          id: true,
          isPublic: true,
          Organization: {
            select: {
              orgId: true
            }
          }
        }
      }
    }
  });
  return folders;
}

export const updateFolderAction = async (folderId: number, name: string) => {
  const folder = await prisma.folder.update({
    where: { isActive: true, id: folderId },
    data: { name }
  });
    
  revalidatePath('/', "page");
  return folder;
}

export const deleteFolderAction = async (folderId: number) => {
  const folder = await prisma.folder.update({
    where: { id: folderId },
    data: { isActive: false }
  });
  
  revalidatePath('/', "page");
  return folder;
}