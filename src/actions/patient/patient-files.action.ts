"use server";
import "server-only";

import prismaClient from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { uploadFile } from "@/services/azure-blob";
import { FilePrivacy } from "@prisma/client";

// Helper: get the authenticated user's DB record
async function getAuthenticatedUser() {
  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("Unauthorized");
  const user = await prismaClient.user.findUnique({
    where: { userId: session.user.sub, isActive: true },
    select: { id: true, userId: true },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

// Get all folders for the current user (with files, settings, and clinic shares)
export const getPatientFoldersAction = withErrorHandling(async () => {
  const user = await getAuthenticatedUser();

  const folders = await prismaClient.folder.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      FolderSetting: {
        select: {
          id: true,
          privacy: true,
          isPublic: true,
          FolderClinicShares: {
            select: {
              id: true,
              clinicId: true,
              createdAt: true,
              Clinic: { select: { id: true, clinicUid: true, name: true } },
            },
          },
        },
      },
      Files: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          size: true,
          url: true,
          dateTaken: true,
          createdAt: true,
          updatedAt: true,
          FileType: { select: { id: true, name: true } },
          FileSetting: {
            select: {
              id: true,
              privacy: true,
              isPublic: true,
              FileClinicShares: {
                select: {
                  id: true,
                  clinicId: true,
                  createdAt: true,
                  Clinic: { select: { id: true, clinicUid: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return { message: "Folders retrieved", data: folders };
});

export type GetPatientFolders = Awaited<ReturnType<typeof getPatientFoldersAction>>;
export type PatientFolder = NonNullable<GetPatientFolders["data"]>[number];
export type PatientFile = PatientFolder["Files"][number];

// Create folder
export const createPatientFolderAction = withErrorHandling(
  async ({ name, privacy = "PRIVATE" }: { name: string; privacy?: FilePrivacy }) => {
    const user = await getAuthenticatedUser();

    if (!name?.trim()) throw new Error("Folder name is required");

    const folder = await prismaClient.$transaction(async (tx) => {
      const newFolder = await tx.folder.create({
        data: {
          name: name.trim(),
          userId: user.id,
          FolderSetting: {
            create: {
              privacy,
              isPublic: privacy === "PUBLIC",
            },
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          FolderSetting: {
            select: {
              id: true,
              privacy: true,
              isPublic: true,
              FolderClinicShares: {
                select: {
                  id: true,
                  clinicId: true,
                  Clinic: { select: { id: true, clinicUid: true, name: true } },
                },
              },
            },
          },
          Files: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              size: true,
              url: true,
              dateTaken: true,
              createdAt: true,
              updatedAt: true,
              FileType: { select: { id: true, name: true } },
              FileSetting: {
                select: {
                  id: true,
                  privacy: true,
                  isPublic: true,
                  FileClinicShares: {
                    select: {
                      id: true,
                      clinicId: true,
                      Clinic: { select: { id: true, clinicUid: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      return newFolder;
    });

    return { message: "Folder created successfully", data: folder };
  }
);

// Update folder privacy
export const updatePatientFolderPrivacyAction = withErrorHandling(
  async ({ folderId, privacy }: { folderId: number; privacy: FilePrivacy }) => {
    const user = await getAuthenticatedUser();

    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: user.id, isActive: true },
      select: { id: true, FolderSetting: { select: { id: true } } },
    });
    if (!folder) throw new Error("Folder not found");

    if (folder.FolderSetting) {
      await prismaClient.folderSetting.update({
        where: { id: folder.FolderSetting.id },
        data: { privacy, isPublic: privacy === "PUBLIC" },
      });
    } else {
      await prismaClient.folderSetting.create({
        data: {
          folderId: folder.id,
          privacy,
          isPublic: privacy === "PUBLIC",
        },
      });
    }

    return { message: "Folder privacy updated", data: { folderId, privacy } };
  }
);

// Rename folder
export const renamePatientFolderAction = withErrorHandling(
  async ({ folderId, name }: { folderId: number; name: string }) => {
    const user = await getAuthenticatedUser();
    if (!name?.trim()) throw new Error("Folder name is required");

    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: user.id, isActive: true },
      select: { id: true },
    });
    if (!folder) throw new Error("Folder not found");

    const updated = await prismaClient.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
      select: { id: true, name: true, updatedAt: true },
    });

    return { message: "Folder renamed successfully", data: updated };
  }
);

// Delete folder (soft delete)
export const deletePatientFolderAction = withErrorHandling(
  async ({ folderId }: { folderId: number }) => {
    const user = await getAuthenticatedUser();

    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: user.id, isActive: true },
      select: { id: true },
    });
    if (!folder) throw new Error("Folder not found");

    await prismaClient.folder.update({
      where: { id: folderId },
      data: { isActive: false, deletedAt: new Date() },
    });

    return { message: "Folder deleted successfully", data: { folderId } };
  }
);

// Upload file to a folder
export const uploadPatientFileAction = withErrorHandling(
  async (formData: FormData) => {
    const user = await getAuthenticatedUser();

    const file = formData.get("file") as File | null;
    const folderId = Number(formData.get("folderId"));
    const fileTypeId = Number(formData.get("fileTypeId"));
    const dateTakenRaw = formData.get("dateTaken") as string | null;

    if (!file) throw new Error("No file provided");
    if (!folderId) throw new Error("Folder ID is required");
    if (!fileTypeId) throw new Error("File type is required");

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) throw new Error("File size must not exceed 25MB");

    // Verify folder ownership
    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: user.id, isActive: true },
      select: { id: true },
    });
    if (!folder) throw new Error("Folder not found");

    // Upload to Azure Blob - sanitize filename to prevent path traversal
    // Dots are excluded from allowed chars to block sequences like "../"
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filepath = `patient-files/${user.id}/${folderId}/${Date.now()}-${sanitizedName}`;
    const buffer = await file.arrayBuffer();
    const { url } = await uploadFile(filepath, buffer, file.type);

    // Create file record
    const newFile = await prismaClient.$transaction(async (tx) => {
      const createdFile = await tx.file.create({
        data: {
          folderId,
          fileTypeId,
          name: file.name,
          size: file.size,
          url,
          dateTaken: dateTakenRaw ? new Date(dateTakenRaw) : null,
          FileSetting: {
            create: {
              privacy: "PRIVATE",
              isPublic: false,
            },
          },
        },
        select: {
          id: true,
          name: true,
          size: true,
          url: true,
          dateTaken: true,
          createdAt: true,
          updatedAt: true,
          FileType: { select: { id: true, name: true } },
          FileSetting: {
            select: {
              id: true,
              privacy: true,
              isPublic: true,
              FileClinicShares: {
                select: {
                  id: true,
                  clinicId: true,
                  Clinic: { select: { id: true, clinicUid: true, name: true } },
                },
              },
            },
          },
        },
      });
      return createdFile;
    });

    return { message: "File uploaded successfully", data: newFile };
  }
);

// Update file privacy
export const updatePatientFilePrivacyAction = withErrorHandling(
  async ({ fileId, privacy }: { fileId: number; privacy: FilePrivacy }) => {
    const user = await getAuthenticatedUser();

    const file = await prismaClient.file.findFirst({
      where: {
        id: fileId,
        isActive: true,
        Folder: { userId: user.id, isActive: true },
      },
      select: { id: true, FileSetting: { select: { id: true } } },
    });
    if (!file) throw new Error("File not found");

    if (file.FileSetting) {
      await prismaClient.fileSetting.update({
        where: { id: file.FileSetting.id },
        data: { privacy, isPublic: privacy === "PUBLIC" },
      });
    } else {
      await prismaClient.fileSetting.create({
        data: {
          fileId: file.id,
          privacy,
          isPublic: privacy === "PUBLIC",
        },
      });
    }

    return { message: "File privacy updated", data: { fileId, privacy } };
  }
);

// Delete file (soft delete)
export const deletePatientFileAction = withErrorHandling(
  async ({ fileId }: { fileId: number }) => {
    const user = await getAuthenticatedUser();

    const file = await prismaClient.file.findFirst({
      where: {
        id: fileId,
        isActive: true,
        Folder: { userId: user.id, isActive: true },
      },
      select: { id: true },
    });
    if (!file) throw new Error("File not found");

    await prismaClient.file.update({
      where: { id: fileId },
      data: { isActive: false, deletedAt: new Date() },
    });

    return { message: "File deleted successfully", data: { fileId } };
  }
);

// Share folder with clinic
export const sharePatientFolderWithClinicAction = withErrorHandling(
  async ({ folderId, clinicId }: { folderId: number; clinicId: number }) => {
    const user = await getAuthenticatedUser();

    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: user.id, isActive: true },
      select: { id: true, FolderSetting: { select: { id: true } } },
    });
    if (!folder) throw new Error("Folder not found");

    // Verify user is a patient of this clinic
    const clinicPatient = await prismaClient.clinicPatient.findFirst({
      where: {
        Clinic: { id: clinicId },
        Patient: { id: user.id },
      },
      select: { id: true },
    });
    if (!clinicPatient) throw new Error("You must be a patient of this clinic to share files");

    // Ensure folder setting exists
    let settingId = folder.FolderSetting?.id;
    if (!settingId) {
      const setting = await prismaClient.folderSetting.create({
        data: { folderId: folder.id, privacy: "CLINIC", isPublic: false },
      });
      settingId = setting.id;
    } else {
      await prismaClient.folderSetting.update({
        where: { id: settingId },
        data: { privacy: "CLINIC" },
      });
    }

    // Upsert the clinic share
    const share = await prismaClient.folderClinicShare.upsert({
      where: { unique_folder_clinic_share: { folderSettingId: settingId, clinicId } },
      create: { folderSettingId: settingId, clinicId },
      update: {},
      select: { id: true, clinicId: true, Clinic: { select: { id: true, clinicUid: true, name: true } } },
    });

    return { message: "Folder shared with clinic", data: share };
  }
);

// Unshare folder from clinic
export const unsharePatientFolderFromClinicAction = withErrorHandling(
  async ({ folderId, clinicId }: { folderId: number; clinicId: number }) => {
    const user = await getAuthenticatedUser();

    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: user.id, isActive: true },
      select: {
        id: true,
        FolderSetting: {
          select: {
            id: true,
            FolderClinicShares: { where: { clinicId }, select: { id: true } },
          },
        },
      },
    });
    if (!folder || !folder.FolderSetting) throw new Error("Folder not found");

    const shareId = folder.FolderSetting.FolderClinicShares[0]?.id;
    if (!shareId) throw new Error("Share not found");

    await prismaClient.folderClinicShare.delete({ where: { id: shareId } });

    // If no more clinic shares, revert privacy to PRIVATE
    const remainingShares = await prismaClient.folderClinicShare.count({
      where: { folderSettingId: folder.FolderSetting.id },
    });
    if (remainingShares === 0) {
      await prismaClient.folderSetting.update({
        where: { id: folder.FolderSetting.id },
        data: { privacy: "PRIVATE" },
      });
    }

    return { message: "Folder unshared from clinic", data: { folderId, clinicId } };
  }
);

// Share file with clinic
export const sharePatientFileWithClinicAction = withErrorHandling(
  async ({ fileId, clinicId }: { fileId: number; clinicId: number }) => {
    const user = await getAuthenticatedUser();

    const file = await prismaClient.file.findFirst({
      where: {
        id: fileId,
        isActive: true,
        Folder: { userId: user.id, isActive: true },
      },
      select: { id: true, FileSetting: { select: { id: true } } },
    });
    if (!file) throw new Error("File not found");

    // Verify user is a patient of this clinic
    const clinicPatient = await prismaClient.clinicPatient.findFirst({
      where: { Clinic: { id: clinicId }, Patient: { id: user.id } },
      select: { id: true },
    });
    if (!clinicPatient) throw new Error("You must be a patient of this clinic to share files");

    let settingId = file.FileSetting?.id;
    if (!settingId) {
      const setting = await prismaClient.fileSetting.create({
        data: { fileId: file.id, privacy: "CLINIC", isPublic: false },
      });
      settingId = setting.id;
    } else {
      await prismaClient.fileSetting.update({
        where: { id: settingId },
        data: { privacy: "CLINIC" },
      });
    }

    const share = await prismaClient.fileClinicShare.upsert({
      where: { unique_file_clinic_share: { fileSettingId: settingId, clinicId } },
      create: { fileSettingId: settingId, clinicId },
      update: {},
      select: { id: true, clinicId: true, Clinic: { select: { id: true, clinicUid: true, name: true } } },
    });

    return { message: "File shared with clinic", data: share };
  }
);

// Unshare file from clinic
export const unsharePatientFileFromClinicAction = withErrorHandling(
  async ({ fileId, clinicId }: { fileId: number; clinicId: number }) => {
    const user = await getAuthenticatedUser();

    const file = await prismaClient.file.findFirst({
      where: {
        id: fileId,
        isActive: true,
        Folder: { userId: user.id, isActive: true },
      },
      select: {
        id: true,
        FileSetting: {
          select: {
            id: true,
            FileClinicShares: { where: { clinicId }, select: { id: true } },
          },
        },
      },
    });
    if (!file || !file.FileSetting) throw new Error("File not found");

    const shareId = file.FileSetting.FileClinicShares[0]?.id;
    if (!shareId) throw new Error("Share not found");

    await prismaClient.fileClinicShare.delete({ where: { id: shareId } });

    const remainingShares = await prismaClient.fileClinicShare.count({
      where: { fileSettingId: file.FileSetting.id },
    });
    if (remainingShares === 0) {
      await prismaClient.fileSetting.update({
        where: { id: file.FileSetting.id },
        data: { privacy: "PRIVATE" },
      });
    }

    return { message: "File unshared from clinic", data: { fileId, clinicId } };
  }
);

// Get all clinics where user is a patient (for sharing UI)
export const getPatientClinicsAction = withErrorHandling(async () => {
  const user = await getAuthenticatedUser();

  const clinicPatients = await prismaClient.clinicPatient.findMany({
    where: { Patient: { id: user.id }, isActive: true },
    select: {
      Clinic: { select: { id: true, clinicUid: true, name: true, logo: true } },
    },
  });

  const clinics = clinicPatients.map((cp) => cp.Clinic);
  return { message: "Patient clinics retrieved", data: clinics };
});
