"use server";

import prisma from "@lib/prisma-common";

export const createFolderAction = async (name: string, userId: string, orgUid?:string) => {
  try {
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
            isPublic: true,
            ...orgUid ? {
              Organization: {
                connect: {
                  orgId: orgUid
                }
              }
            } : {}
          }
        }
      }
    });
    return {
      status: true,
      message: "Folder created successfully",
      data: folder
    }
  } catch (error) {
    console.error(`Error creating folder: ${error}`);
    return {
      status: false,
      message: "Failed to create folder",
      data: null
    }
  }
}

export const getFoldersAction = async (userId: string, orgUid?:string) => {
  const folders = await prisma.folder.findMany({
    where: {
      isActive: true,
      User: {
        userId
      },
      ...orgUid ? {
        FolderSetting: {
          Organization: {
            orgId: orgUid
          }
        }
      } : {}
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
          scopeOrgId: true,
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
    
  return folder;
}

export const deleteFolderAction = async (folderId: number) => {
  const folder = await prisma.folder.update({
    where: { id: folderId },
    data: { isActive: false }
  });
  
  return folder;
}