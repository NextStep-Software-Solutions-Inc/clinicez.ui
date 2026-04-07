"use server";
import "server-only";

import { uploadFile } from "@/services/azure-blob";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import prisma from "@/lib/prisma";

/** Requirement types that require file uploads (not structured records) */
export const FILE_UPLOAD_REQUIREMENT_TYPES = [
  "medical_certificate",
  "xray_result",
  "other",
] as const;

export type FileUploadRequirementType = (typeof FILE_UPLOAD_REQUIREMENT_TYPES)[number];

export function isFileUploadRequirement(req: string): req is FileUploadRequirementType {
  return (FILE_UPLOAD_REQUIREMENT_TYPES as readonly string[]).includes(req);
}

export type StagedRequirementFile = {
  requirementType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
};

/**
 * Uploads a requirement file to blob storage without creating a DB record yet.
 * Returns file metadata to be stored in state and linked after the org member record is created.
 * Used in the self-service join flow where the orgMemberId is not yet known.
 */
export const stageRequirementFileUploadAction = withErrorHandling(
  async (formData: FormData): Promise<StagedRequirementFile> => {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    const file = formData.get("file") as File | null;
    const requirementType = formData.get("requirementType") as string | null;

    if (!file) throw new Error("No file provided");
    if (!requirementType) throw new Error("Requirement type is required");

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) throw new Error("File size must not exceed 25 MB");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeUserId = session.user.sub.replace(/[^a-zA-Z0-9]/g, "_");
    const filepath = `org-requirements/staging/${safeUserId}/${requirementType}/${Date.now()}-${sanitizedName}`;
    const buffer = await file.arrayBuffer();
    const { url } = await uploadFile(filepath, buffer, file.type);

    return {
      requirementType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "",
      url,
    };
  }
);

/**
 * Links previously staged requirement files to an org member record.
 * Creates OrgMemberRequirementFile rows. Called after joinOrganizationAction
 * returns the new org member ID.
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
            fileName: f.fileName,
            fileSize: f.fileSize,
            mimeType: f.mimeType || null,
            url: f.url,
          },
          select: {
            id: true,
            requirementType: true,
            fileName: true,
            fileSize: true,
            url: true,
            createdAt: true,
          },
        })
      )
    );

    return { message: "Requirement files linked", data: created };
  }
);
