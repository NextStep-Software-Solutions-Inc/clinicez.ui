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

// Helper: generate a unique display name to avoid overwriting existing files
// e.g. "report.pdf" → "report_20260224_153045.pdf"
function generateUniqueDisplayName(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".");
  const ext = lastDot !== -1 ? originalName.slice(lastDot) : "";
  const base = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${ms}`;
  return `${base}_${ts}${ext}`;
}

// Get brief context info about the current patient (for the files page header)
export const getPatientContextAction = withErrorHandling(async () => {
  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("Unauthorized");
  const user = await prismaClient.user.findUnique({
    where: { userId: session.user.sub, isActive: true },
    select: {
      firstName: true,
      lastName: true,
      middleName: true,
      picture: true,
      bloodType: true,
      gender: true,
      dob: true,
      caseNumber: true,
    },
  });
  if (!user) throw new Error("Unauthorized");
  const age = user.dob
    ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ") || "Patient";
  return {
    message: "Patient context retrieved",
    data: {
      name: fullName,
      picture: user.picture ?? null,
      bloodType: (user.bloodType as string | null),
      gender: (user.gender as string | null),
      age,
      caseNumber: user.caseNumber ?? null,
    },
  };
});

export type PatientContext = NonNullable<Awaited<ReturnType<typeof getPatientContextAction>>["data"]>;

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
      userId: true,
      createdByUserId: true,
      CreatedByUser: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      FolderSetting: {
        select: {
          id: true,
          privacy: true,
          isPublic: true,
          scopeClinicId: true,
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
          mimeType: true,
          dateTaken: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
          CreatedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          FileType: { select: { id: true, name: true } },
          FileSetting: {
            select: {
              id: true,
              privacy: true,
              isPublic: true,
              scopeClinicId: true,
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
          createdByUserId: user.id,
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
          userId: true,
          createdByUserId: true,
          CreatedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          FolderSetting: {
            select: {
              id: true,
              privacy: true,
              isPublic: true,
              scopeClinicId: true,
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
              mimeType: true,
              dateTaken: true,
              createdAt: true,
              updatedAt: true,
              createdByUserId: true,
              CreatedByUser: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              FileType: { select: { id: true, name: true } },
              FileSetting: {
                select: {
                  id: true,
                  privacy: true,
                  isPublic: true,
                  scopeClinicId: true,
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
      select: {
        id: true,
        userId: true,
        createdByUserId: true,
        FolderSetting: { select: { id: true } },
      },
    });
    if (!folder) throw new Error("Folder not found");

    // Patient cannot set provider-created folders to PRIVATE
    const isProviderCreated =
      folder.createdByUserId !== null && folder.createdByUserId !== folder.userId;
    if (isProviderCreated && privacy === "PRIVATE") {
      throw new Error(
        "Cannot set a provider-created folder to private"
      );
    }

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
      where: { id: folderId, isActive: true },
      select: {
        id: true,
        userId: true,
        FolderSetting: { select: { id: true, scopeClinicId: true } },
      },
    });
    if (!folder) throw new Error("Folder not found");

    // Patient who owns the folder OR a member of the creator's clinic can rename
    let hasAccess = folder.userId === user.id;
    if (!hasAccess && folder.FolderSetting?.scopeClinicId) {
      const membership = await prismaClient.clinicMember.findFirst({
        where: {
          userId: user.id,
          clinicId: folder.FolderSetting.scopeClinicId,
          isActive: true,
        },
        select: { id: true },
      });
      hasAccess = membership !== null;
    }
    if (!hasAccess) throw new Error("Folder not found");

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

    // Fetch folder with fields needed for permission check
    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, isActive: true },
      select: {
        id: true,
        userId: true,
        createdByUserId: true,
        FolderSetting: {
          select: {
            scopeClinicId: true,
          },
        },
      },
    });
    if (!folder) throw new Error("Folder not found");

    // Provider-created: createdByUserId is set and differs from the patient owner
    const isProviderCreated =
      folder.createdByUserId !== null && folder.createdByUserId !== folder.userId;

    let hasAccess = folder.createdByUserId === user.id; // creator always has access

    if (!hasAccess && !isProviderCreated && folder.userId === user.id) {
      // Patient owns and created it (no provider involved)
      hasAccess = true;
    }

    if (!hasAccess && isProviderCreated && folder.FolderSetting?.scopeClinicId) {
      // Only members of the creator's clinic have full control
      const membership = await prismaClient.clinicMember.findFirst({
        where: {
          userId: user.id,
          clinicId: folder.FolderSetting.scopeClinicId,
          isActive: true,
        },
        select: { id: true },
      });
      hasAccess = membership !== null;
    }

    if (!hasAccess) throw new Error("Folder not found");

    await prismaClient.$transaction([
      // Soft-delete all active files inside the folder
      prismaClient.file.updateMany({
        where: { folderId, isActive: true },
        data: { isActive: false, deletedAt: new Date() },
      }),
      // Soft-delete the folder itself
      prismaClient.folder.update({
        where: { id: folderId },
        data: { isActive: false, deletedAt: new Date() },
      }),
    ]);

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
    const uniqueDisplayName = generateUniqueDisplayName(file.name);

    // Create file record
    const newFile = await prismaClient.$transaction(async (tx) => {
      const createdFile = await tx.file.create({
        data: {
          folderId,
          fileTypeId,
          name: uniqueDisplayName,
          size: file.size,
          url,
          mimeType: file.type || null,
          dateTaken: dateTakenRaw ? new Date(dateTakenRaw) : null,
          createdByUserId: user.id,
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
          mimeType: true,
          dateTaken: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
          CreatedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
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

// Update file privacy (patient only; cannot set PRIVATE on provider-created files)
export const updatePatientFilePrivacyAction = withErrorHandling(
  async ({ fileId, privacy }: { fileId: number; privacy: FilePrivacy }) => {
    const user = await getAuthenticatedUser();

    const file = await prismaClient.file.findFirst({
      where: {
        id: fileId,
        isActive: true,
        Folder: { userId: user.id, isActive: true },
      },
      select: {
        id: true,
        createdByUserId: true,
        Folder: { select: { userId: true } },
        FileSetting: { select: { id: true } },
      },
    });
    if (!file) throw new Error("File not found");

    // Patient cannot set provider-created files to PRIVATE
    const patientUserId = file.Folder?.userId;
    const isProviderCreated =
      file.createdByUserId !== null && file.createdByUserId !== patientUserId;
    if (isProviderCreated && privacy === "PRIVATE") {
      throw new Error("Cannot set a provider-uploaded file to private");
    }

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

    // Fetch file with fields needed for permission check
    const file = await prismaClient.file.findFirst({
      where: { id: fileId, isActive: true },
      select: {
        id: true,
        createdByUserId: true,
        Folder: { select: { userId: true } },
        FileSetting: {
          select: {
            scopeClinicId: true,
          },
        },
      },
    });
    if (!file) throw new Error("File not found");

    const patientUserId = file.Folder?.userId;
    // Provider-created: createdByUserId is set and differs from the patient folder owner
    const isProviderCreated =
      file.createdByUserId !== null && file.createdByUserId !== patientUserId;

    let hasAccess = file.createdByUserId === user.id; // creator always has access

    if (!hasAccess && !isProviderCreated && patientUserId === user.id) {
      // Patient owns the folder and created the file themselves
      hasAccess = true;
    }

    if (!hasAccess && isProviderCreated && file.FileSetting?.scopeClinicId) {
      // Only members of the creator's clinic have full control
      const membership = await prismaClient.clinicMember.findFirst({
        where: {
          userId: user.id,
          clinicId: file.FileSetting.scopeClinicId,
          isActive: true,
        },
        select: { id: true },
      });
      hasAccess = membership !== null;
    }

    if (!hasAccess) throw new Error("File not found");

    await prismaClient.file.update({
      where: { id: fileId },
      data: { isActive: false, deletedAt: new Date() },
    });

    return { message: "File deleted successfully", data: { fileId } };
  }
);

// Rename file (patient owner OR member of the creator's clinic)
export const renamePatientFileAction = withErrorHandling(
  async ({ fileId, name }: { fileId: number; name: string }) => {
    const user = await getAuthenticatedUser();
    if (!name?.trim()) throw new Error("File name is required");

    const file = await prismaClient.file.findFirst({
      where: { id: fileId, isActive: true },
      select: {
        id: true,
        Folder: { select: { userId: true } },
        FileSetting: { select: { id: true, scopeClinicId: true } },
      },
    });
    if (!file) throw new Error("File not found");

    const patientUserId = file.Folder?.userId;
    let hasAccess = patientUserId === user.id;

    if (!hasAccess && file.FileSetting?.scopeClinicId) {
      const membership = await prismaClient.clinicMember.findFirst({
        where: {
          userId: user.id,
          clinicId: file.FileSetting.scopeClinicId,
          isActive: true,
        },
        select: { id: true },
      });
      hasAccess = membership !== null;
    }
    if (!hasAccess) throw new Error("File not found");

    const updated = await prismaClient.file.update({
      where: { id: fileId },
      data: { name: name.trim() },
      select: { id: true, name: true, updatedAt: true },
    });

    return { message: "File renamed successfully", data: updated };
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
            scopeClinicId: true,
            FolderClinicShares: { where: { clinicId }, select: { id: true } },
          },
        },
      },
    });
    if (!folder || !folder.FolderSetting) throw new Error("Folder not found");

    // Cannot unshare the creator's clinic
    if (folder.FolderSetting.scopeClinicId === clinicId) {
      throw new Error("Cannot unshare the clinic that created this folder");
    }

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
            scopeClinicId: true,
            FileClinicShares: { where: { clinicId }, select: { id: true } },
          },
        },
      },
    });
    if (!file || !file.FileSetting) throw new Error("File not found");

    // Cannot unshare the creator's clinic
    if (file.FileSetting.scopeClinicId === clinicId) {
      throw new Error("Cannot unshare the clinic that uploaded this file");
    }

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

// ─── Healthcare provider actions ────────────────────────────────────────────

const FOLDER_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  createdByUserId: true,
  CreatedByUser: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  FolderSetting: {
    select: {
      id: true,
      privacy: true,
      isPublic: true,
      scopeClinicId: true,
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
    orderBy: { updatedAt: "desc" } as const,
    select: {
      id: true,
      name: true,
      size: true,
      url: true,
      mimeType: true,
      dateTaken: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      CreatedByUser: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      FileType: { select: { id: true, name: true } },
      FileSetting: {
        select: {
          id: true,
          privacy: true,
          isPublic: true,
          scopeClinicId: true,
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
} as const;

/**
 * Verify that the calling user has access to the clinic and that the patient
 * is registered at that clinic. Returns the clinic DB id.
 */
async function requireClinicPatientAccess(
  providerSub: string,
  clinicUid: string,
  patientId: number
): Promise<{ clinicId: number }> {
  const clinic = await prismaClient.clinic.findUnique({
    where: { clinicUid },
    select: { id: true },
  });
  if (!clinic) throw new Error("Clinic not found");

  // Verify the calling user is an active member of the clinic
  const member = await prismaClient.clinicMember.findFirst({
    where: {
      Clinic: { clinicUid },
      User: { userId: providerSub },
      isActive: true,
    },
    select: { id: true },
  });
  if (!member) throw new Error("Unauthorized: not a member of this clinic");

  // Verify the patient is registered at the clinic
  const clinicPatient = await prismaClient.clinicPatient.findFirst({
    where: {
      Clinic: { clinicUid },
      Patient: { id: patientId },
      isActive: true,
    },
    select: { id: true },
  });
  if (!clinicPatient) throw new Error("Patient is not registered at this clinic");

  return { clinicId: clinic.id };
}

/**
 * Returns folders/files for a patient that are visible to a given clinic:
 * - Folders shared with that clinic (privacy=CLINIC + FolderClinicShare)
 * - Folders that are PUBLIC
 * Within each folder, only files that are CLINIC-shared with this clinic or PUBLIC.
 */
export const getPatientFilesForClinicAction = withErrorHandling(
  async ({ patientId, clinicUid }: { patientId: number; clinicUid: string }) => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    const { clinicId } = await requireClinicPatientAccess(
      session.user.sub,
      clinicUid,
      patientId
    );

    const allFolders = await prismaClient.folder.findMany({
      where: {
        userId: patientId,
        isActive: true,
        OR: [
          // Public folders
          { FolderSetting: { privacy: "PUBLIC" } },
          // Folders shared with this clinic
          {
            FolderSetting: {
              privacy: "CLINIC",
              FolderClinicShares: { some: { clinicId } },
            },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        ...FOLDER_SELECT,
        Files: {
          where: {
            isActive: true,
            OR: [
              { FileSetting: { privacy: "PUBLIC" } },
              {
                FileSetting: {
                  privacy: "CLINIC",
                  FileClinicShares: { some: { clinicId } },
                },
              },
            ],
          },
          orderBy: { updatedAt: "desc" },
          select: FOLDER_SELECT.Files.select,
        },
      },
    });

    return { message: "Patient files retrieved", data: allFolders };
  }
);

/**
 * Create a folder on the patient's account on behalf of the clinic (provider action).
 * The folder is automatically shared with the clinic.
 */
export const createFolderForPatientAction = withErrorHandling(
  async ({
    patientId,
    clinicUid,
    name,
  }: {
    patientId: number;
    clinicUid: string;
    name: string;
  }) => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");
    if (!name?.trim()) throw new Error("Folder name is required");

    const { clinicId } = await requireClinicPatientAccess(
      session.user.sub,
      clinicUid,
      patientId
    );

    // Get the calling user's DB ID to track who created this folder
    const callerUser = await prismaClient.user.findUnique({
      where: { userId: session.user.sub, isActive: true },
      select: { id: true },
    });
    if (!callerUser) throw new Error("Unauthorized");

    const folder = await prismaClient.$transaction(async (tx) => {
      const newFolder = await tx.folder.create({
        data: {
          name: name.trim(),
          userId: patientId,
          createdByUserId: callerUser.id,
          FolderSetting: {
            create: {
              privacy: "CLINIC",
              isPublic: false,
              scopeClinicId: clinicId,
              FolderClinicShares: { create: { clinicId } },
            },
          },
        },
        select: {
          ...FOLDER_SELECT,
        },
      });
      return newFolder;
    });

    return { message: "Folder created", data: folder };
  }
);

/**
 * Upload a file into a patient folder on behalf of the clinic (provider action).
 * The file is automatically shared with the clinic.
 */
export const uploadFileForPatientAction = withErrorHandling(
  async (formData: FormData) => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    const patientId = Number(formData.get("patientId"));
    const clinicUid = formData.get("clinicUid") as string | null;
    const folderId = Number(formData.get("folderId"));
    const fileTypeId = Number(formData.get("fileTypeId"));
    const file = formData.get("file") as File | null;
    const dateTakenRaw = formData.get("dateTaken") as string | null;

    if (!clinicUid) throw new Error("Clinic UID is required");
    if (!file) throw new Error("No file provided");
    if (!folderId) throw new Error("Folder ID is required");
    if (!fileTypeId) throw new Error("File type is required");

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) throw new Error("File size must not exceed 25MB");

    const { clinicId } = await requireClinicPatientAccess(
      session.user.sub,
      clinicUid,
      patientId
    );

    // Get the calling user's DB ID to track who uploaded this file
    const callerUser = await prismaClient.user.findUnique({
      where: { userId: session.user.sub, isActive: true },
      select: { id: true },
    });
    if (!callerUser) throw new Error("Unauthorized");

    // Verify folder belongs to the patient
    const folder = await prismaClient.folder.findFirst({
      where: { id: folderId, userId: patientId, isActive: true },
      select: { id: true },
    });
    if (!folder) throw new Error("Folder not found");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filepath = `patient-files/${patientId}/${folderId}/${Date.now()}-${sanitizedName}`;
    const buffer = await file.arrayBuffer();
    const { url } = await uploadFile(filepath, buffer, file.type);
    const uniqueDisplayName = generateUniqueDisplayName(file.name);

    const newFile = await prismaClient.$transaction(async (tx) => {
      const created = await tx.file.create({
        data: {
          folderId,
          fileTypeId,
          name: uniqueDisplayName,
          size: file.size,
          url,
          mimeType: file.type || null,
          dateTaken: dateTakenRaw ? new Date(dateTakenRaw) : null,
          createdByUserId: callerUser.id,
          FileSetting: {
            create: {
              privacy: "CLINIC",
              isPublic: false,
              scopeClinicId: clinicId,
              FileClinicShares: { create: { clinicId } },
            },
          },
        },
        select: {
          id: true,
          name: true,
          size: true,
          url: true,
          mimeType: true,
          dateTaken: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
          CreatedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          FileType: { select: { id: true, name: true } },
          FileSetting: {
            select: {
              id: true,
              privacy: true,
              isPublic: true,
              scopeClinicId: true,
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
      return created;
    });

    return { message: "File uploaded successfully", data: newFile };
  }
);
