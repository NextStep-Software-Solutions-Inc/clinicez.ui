"use server";
import "server-only";

import { uploadFile } from "@/services/azure-blob";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import prisma from "@/lib/prisma";
import { isFileUploadRequirement, type StagedRequirementFile } from "@/lib/requirement-types";

// Human-readable FileType name per requirement type
const FILE_TYPE_NAMES: Record<string, string> = {
  medical_certificate: "Medical Certificate",
  xray_result: "X-Ray Result",
  other: "Document",
};

function generateTimestampedName(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".");
  const ext = lastDot !== -1 ? originalName.slice(lastDot) : "";
  const base = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${base}_${ts}${ext}`;
}

/**
 * Uploads a requirement file and stores it in the patient's Folder/File system.
 * Creates or reuses a per-org folder owned by the patient and shares it with
 * all of the org's partner clinics via FolderClinicShare / FileClinicShare.
 * Returns lightweight staged metadata (fileId + display info) that gets linked
 * to the OrgMemberRequirementFile record once the org member ID is known.
 *
 * FormData params:
 *   file            – the File blob
 *   requirementType – e.g. "medical_certificate"
 *   orgUid          – org to look up partner clinics
 *   targetUserId    – (optional) for admin flow: the userId of the joining member;
 *                     defaults to the authenticated caller (self-service flow)
 */
export const stageRequirementFileUploadAction = withErrorHandling(
  async (formData: FormData) => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    const file = formData.get("file") as File | null;
    const requirementType = formData.get("requirementType") as string | null;
    const orgUid = formData.get("orgUid") as string | null;
    const targetUserIdParam = formData.get("targetUserId") as string | null;

    if (!file) throw new Error("No file provided");
    if (!requirementType) throw new Error("Requirement type is required");
    if (!orgUid) throw new Error("Organization UID is required");

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) throw new Error("File size must not exceed 25 MB");

    // Determine target user — self-service uses session user; admin passes targetUserId
    let targetUserSub: string = session.user.sub;
    if (targetUserIdParam && targetUserIdParam !== session.user.sub) {
      // Admin flow: verify caller is an active org admin
      const callerUser = await prisma.user.findUnique({
        where: { userId: session.user.sub, isActive: true },
        select: { id: true },
      });
      if (!callerUser) throw new Error("Unauthorized");
      const isAdmin = await prisma.organizationMember.findFirst({
        where: {
          userId: callerUser.id,
          Organization: { orgUid },
          status: "ACTIVE",
          OrganizationRole: { name: { equals: "ADMIN", mode: "insensitive" } },
        },
        select: { id: true },
      });
      if (!isAdmin) throw new Error("Unauthorized: not an org admin");
      targetUserSub = targetUserIdParam;
    }

    const targetUser = await prisma.user.findUnique({
      where: { userId: targetUserSub, isActive: true },
      select: { id: true },
    });
    if (!targetUser) throw new Error("Target user not found");

    // Look up org and its partner clinic IDs
    const org = await prisma.organization.findUnique({
      where: { orgUid },
      select: {
        id: true,
        name: true,
        ClinicOrganizations: {
          where: { isActive: true },
          select: { clinicId: true },
        },
      },
    });
    if (!org) throw new Error("Organization not found");

    const partnerClinicIds = org.ClinicOrganizations.map((co) => co.clinicId);

    // Resolve or create a FileType for this requirement
    const fileTypeName = FILE_TYPE_NAMES[requirementType] ?? "Document";
    let fileType = await prisma.fileType.findFirst({
      where: { name: fileTypeName, isActive: true },
      select: { id: true },
    });
    if (!fileType) {
      fileType = await prisma.fileType.create({
        data: { name: fileTypeName },
        select: { id: true },
      });
    }

    // Find or create the per-org requirements folder for this patient
    const folderName = `Org Requirements - ${org.name}`;
    let folder = await prisma.folder.findFirst({
      where: { userId: targetUser.id, name: folderName, isActive: true },
      select: { id: true, FolderSetting: { select: { id: true } } },
    });
    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: folderName,
          userId: targetUser.id,
          FolderSetting: { create: { isPublic: false, privacy: "PRIVATE" } },
        },
        select: { id: true, FolderSetting: { select: { id: true } } },
      });
    }
    // Ensure FolderSetting exists (should always exist after create above)
    if (!folder.FolderSetting) {
      await prisma.folderSetting.create({
        data: { folderId: folder.id, isPublic: false, privacy: "PRIVATE" },
      });
      folder = await prisma.folder.findUnique({
        where: { id: folder.id },
        select: { id: true, FolderSetting: { select: { id: true } } },
      });
    }
    const resolvedFolder = folder;
    const folderSettingId = resolvedFolder?.FolderSetting?.id;
    if (!resolvedFolder || !folderSettingId) throw new Error("Failed to create or resolve org requirements folder");

    // Share the folder with any partner clinics not already sharing
    if (partnerClinicIds.length > 0) {
      const existingShares = await prisma.folderClinicShare.findMany({
        where: { folderSettingId },
        select: { clinicId: true },
      });
      const existingClinicIds = new Set(existingShares.map((s) => s.clinicId));
      const newClinicIds = partnerClinicIds.filter((id) => !existingClinicIds.has(id));
      if (newClinicIds.length > 0) {
        await prisma.folderClinicShare.createMany({
          data: newClinicIds.map((clinicId) => ({ folderSettingId, clinicId })),
          skipDuplicates: true,
        });
        await prisma.folderSetting.update({
          where: { id: folderSettingId },
          data: { privacy: "CLINIC", isPublic: false },
        });
      }
    }

    // Upload file to Azure Blob
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filepath = `org-requirements/${orgUid}/${targetUser.id}/${requirementType}/${Date.now()}-${sanitizedName}`;
    const buffer = await file.arrayBuffer();
    const { url } = await uploadFile(filepath, buffer, file.type);
    const timestampedFileName = generateTimestampedName(file.name);

    // Create the File record, shared with all partner clinics
    const createdFile = await prisma.file.create({
      data: {
        folderId: resolvedFolder.id,
        fileTypeId: fileType.id,
        name: timestampedFileName,
        size: file.size,
        url,
        mimeType: file.type || null,
        createdByUserId: targetUser.id,
        FileSetting: {
          create: {
            privacy: partnerClinicIds.length > 0 ? "CLINIC" : "PRIVATE",
            isPublic: false,
            ...(partnerClinicIds.length > 0 && {
              FileClinicShares: {
                create: partnerClinicIds.map((clinicId) => ({ clinicId })),
              },
            }),
          },
        },
      },
      select: { id: true, name: true, size: true },
    });

    return {
      message: "File uploaded successfully",
      data: {
        requirementType,
        fileId: createdFile.id,
        fileName: createdFile.name,
        fileSize: createdFile.size,
      } satisfies StagedRequirementFile,
    };
  }
);

/**
 * Links previously staged requirement files to an org member record.
 * Creates OrgMemberRequirementFile rows pointing to the File records.
 * Called after joinOrganizationAction returns the new org member ID.
 * The caller must be either the org member themselves or an active org admin.
 */
export const linkRequirementFilesAction = withErrorHandling(
  async ({
    orgMemberId,
    files,
  }: {
    orgMemberId: number;
    files: StagedRequirementFile[];
  }) => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    if (!files.length) return { message: "No files to link", data: [] };

    const orgMember = await prisma.organizationMember.findFirst({
      where: { id: orgMemberId },
      select: {
        id: true,
        User: { select: { userId: true } },
        Organization: { select: { orgUid: true } },
      },
    });
    if (!orgMember) throw new Error("Org member not found");

    const isOwnMember = orgMember.User.userId === session.user.sub;
    if (!isOwnMember) {
      const callerUser = await prisma.user.findUnique({
        where: { userId: session.user.sub, isActive: true },
        select: { id: true },
      });
      if (!callerUser) throw new Error("Unauthorized");
      const isAdmin = await prisma.organizationMember.findFirst({
        where: {
          userId: callerUser.id,
          Organization: { orgUid: orgMember.Organization.orgUid },
          status: "ACTIVE",
          OrganizationRole: { name: { equals: "ADMIN", mode: "insensitive" } },
        },
        select: { id: true },
      });
      if (!isAdmin) throw new Error("Unauthorized");
    }

    const created = await prisma.$transaction(
      files.map((f) =>
        prisma.orgMemberRequirementFile.create({
          data: {
            orgMemberId,
            requirementType: f.requirementType,
            fileId: f.fileId,
          },
          select: {
            id: true,
            requirementType: true,
            fileId: true,
            createdAt: true,
          },
        })
      )
    );

    return { message: "Requirement files linked", data: created };
  }
);

