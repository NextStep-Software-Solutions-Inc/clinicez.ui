/**
 * Requirement type utilities and constants.
 * Shared between client and server code.
 */

/** Requirement types that require file uploads (not structured records) */
export const FILE_UPLOAD_REQUIREMENT_TYPES = [
    "medical_certificate",
    "xray_result",
    "other",
] as const;

export type FileUploadRequirementType = (typeof FILE_UPLOAD_REQUIREMENT_TYPES)[number];

/**
 * Type guard to check if a requirement type requires file upload
 */
export function isFileUploadRequirement(req: string): req is FileUploadRequirementType {
    return (FILE_UPLOAD_REQUIREMENT_TYPES as readonly string[]).includes(req);
}

/** Staged requirement file metadata for upload */
export type StagedRequirementFile = {
    requirementType: string;
    fileId: number;
    fileName: string;
    fileSize: number;
};
