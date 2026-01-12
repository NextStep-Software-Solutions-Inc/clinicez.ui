"use server";

import { hasCodeProperty, hasContextProperty } from "@/lib/utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import { Prisma } from "@prisma/client";
import { findUserSafely } from "@/lib/user-sync";
import { withRetry } from "@/lib/database-health";
import prisma from "@lib/prisma";

export const createFolderAction = withErrorHandling(async ({ name, userId, clinicUid }: { name: string, userId: string, clinicUid?: string }) => {
  // Validate input
  if (!name || !name.trim()) {
    throw new Error("Folder name is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  // Use retry mechanism to handle transient database issues
  const result = await withRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      // Find the user safely, handling migration scenarios
      const currentUser = await findUserSafely(userId);

      if (!currentUser) {
        throw new Error(`User with ID ${userId} not found or inactive`);
      }

      // Check if folder with same name already exists for this user
      const existingFolder = await tx.folder.findFirst({
        where: {
          userId: currentUser.id,
          name: name.trim(),
          isActive: true
        },
        select: { id: true }
      });

      if (existingFolder) {
        throw new Prisma.PrismaClientKnownRequestError(
          `Folder with name "${name.trim()}" already exists.`,
          {
            code: 'P2002',
            clientVersion: '0.0.0'
          }
        );
      }

      // Create folder first
      const folder = await tx.folder.create({
        data: {
          name: name.trim(),
          userId: currentUser.id,
        },
        select: {
          id: true,
          name: true,
          userId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Create folder settings - handle clinic connection properly
      const folderSettingData: Prisma.FolderSettingCreateInput = {
        Folder: {
          connect: {
            id: folder.id
          }
        },
        isPublic: true,
        ...(clinicUid ? {
          Clinic: {
            connect: {
              clinicUid
            }
          }
        } : {})
      };

      const folderSetting = await tx.folderSetting.create({
        data: folderSettingData
      });

      return { ...folder, folderSetting };
    }, {
      // Use ReadCommitted to balance consistency and performance
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 10000
    });
  }, 3, 200); // Retry up to 3 times with 200ms base delay

  return { message: "Folder created successfully", data: result }
}, async (error, context) => {
  console.error(`Error creating folder:`, error);

  if (hasCodeProperty(error)) {
    // Handle Prisma specific errors
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        if (hasContextProperty(context)) {
          const folderName = (context.args[0] as { name?: string })?.name;
          return folderName
            ? `Folder with name "${folderName}" already exists.`
            : "A folder with this name already exists.";
        }
        return "A folder with this name already exists.";

      case "P2003":
        return "Invalid user reference. Please try logging out and back in.";

      case "P2025":
        return "User not found. Please try logging out and back in.";

      case "P1001":
        return "Database connection error. Please try again.";

      case "P2034":
        return "Transaction failed due to concurrent operations. Please try again.";

      default:
        console.error(`Unhandled Prisma error code: ${error.code}`);
        return "Failed to create folder. Please try again.";
    }
  }

  // Handle general errors
  if (error instanceof Error) {
    // Don't expose internal error messages to users
    const publicMessages = [
      "Folder name is required",
      "User ID is required",
      "User with ID",
      "already exists"
    ];

    const isPublicError = publicMessages.some(msg =>
      error.message.includes(msg)
    );

    if (isPublicError) {
      return error.message;
    }
  }

  return "Failed to create folder. Please try again.";
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