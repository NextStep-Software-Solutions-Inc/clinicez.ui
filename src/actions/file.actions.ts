"use server";
import prisma from "@lib/prisma";
import { revalidatePath } from "next/cache";

type CreateFileType = {
  name: string;
  folderId: number;
  size: number;
  url: string;
  fileTypeId: number;
  dateTaken?: Date;
}

export const createFileAction = async ({ name, folderId, size, fileTypeId, url, dateTaken }:CreateFileType) => {
  const file = await prisma.file.create({
    data: {
      name,
      folderId,
      size,
      url,
      fileTypeId,
      dateTaken,
      FileSetting: {
        create: {
          isPublic: true
        }
      }
    }
  });
  revalidatePath('/', "page");
  return file;
}


export const getFilesAction = async (userId: string) => {
  const files = await prisma.file.findMany({
    where: {
      isActive: true,
      Folder: {
        User: {
          userId
        }
      }
    },
    select: {
      id: true,
      name: true,
      url: true,
      size: true,
      updatedAt: true,
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
      
      }
    }
  });
  return files;
}

export const updateFileAction = async (fileId: number, name: string) => {
  const file = await prisma.file.update({
    where: {
      id: fileId
    },
    data: {
      name
    }
  });
  revalidatePath('/', "page");
  return file;
}


export const deleteFileAction = async (fileId: number) => {
  const file = await prisma.file.update({
    where: {
      id: fileId
    },
    data: {
      isActive: false
    }
  });

  revalidatePath('/', "page");
  return file;
}
