"use server";

import prisma from "@lib/prisma";

export const createFolderAction = async (name: string, userId: string, clinicUid?:string) => {
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
            ...clinicUid ? {
              Organization: {
                connect: {
                  orgId: clinicUid
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

export const getFoldersAction = async (userId: string, clinicUid?:string) => {
  const folders = await prisma.folder.findMany({
    where: {
      isActive: true,
      User: {
        userId
      },
      ...clinicUid ? {
        FolderSetting: {
          Clinic: {
            clinicUid
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
                  validityDays: true,
                  scopeClinicId: true
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
          scopeClinicId: true,
          Clinic: {
            select: {
              clinicUid: true
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