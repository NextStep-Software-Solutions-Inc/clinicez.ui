"use server";

import { hasCodeProperty, hasContextProperty } from "@/lib/utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import prisma from "@lib/prisma";

export const createFolderAction = withErrorHandling(async ({ name, userId, clinicUid }: { name: string, userId: string, clinicUid?: string }) => {
  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  const folder = await prisma.folder.create({
    data: {
      name,
      User: {
        connect: {
          id: currentUser.id
        }
      },
      FolderSetting: {
        create: {
          isPublic: true,
          ...(clinicUid ? {
            Clinic: {
              connect: {
                clinicUid
              }
            }
          } : {})
        }
      }
    }
  });
  return { message: "Folder created successfully", data: folder }
}, async (error, context) => {
  if (hasCodeProperty(error) && error.code === "P2002") {
    if (hasContextProperty(context)) {
      return `Folder with name "${(context.args[0] as { name?: string })?.name}" already exists.`;
    }
    return "Folder with this name already exists.";
  }
  return "Failed to create folder";
})

export const getFoldersAction = async (userId: string, clinicUid?: string) => {
  const folders = await prisma.folder.findMany({
    where: {
      isActive: true,
      User: {
        userId
      },
      ...(clinicUid ? {
        FolderSetting: {
          Clinic: {
            clinicUid
          }
        }
      } : {})
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
              validUntil: true
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