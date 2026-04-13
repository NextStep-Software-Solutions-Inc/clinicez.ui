/**
 * Requirement type utilities and constants.
 * Shared between client and server code.
 */

export const REQUIREMENT_STUDENT_RECORD = "student_record";
export const REQUIREMENT_EMPLOYEE_RECORD = "employee_record";
export const REQUIREMENT_MEDICAL_CERTIFICATE = "medical_certificate";
export const REQUIREMENT_XRAY_RESULT = "xray_result";
export const REQUIREMENT_OTHER = "other";

/** Human-readable labels for known requirement keys */
export const REQUIREMENT_LABEL_MAP: Record<string, string> = {
  [REQUIREMENT_STUDENT_RECORD]: "Student Record",
  [REQUIREMENT_EMPLOYEE_RECORD]: "Employee Record",
  [REQUIREMENT_MEDICAL_CERTIFICATE]: "Medical Certificate",
  [REQUIREMENT_XRAY_RESULT]: "X-Ray Result",
  [REQUIREMENT_OTHER]: "Supporting Document",
};

export function formatRequirementLabel(req: string): string {
  return (
    REQUIREMENT_LABEL_MAP[req] ??
    req.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

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

/** Per-requirement settings controlling whether it is mandatory */
export type RequirementSetting = { isRequired: boolean };
export type RequirementSettings = Record<string, RequirementSetting>;

/**
 * Safely parse a Prisma JsonValue into RequirementSettings.
 * Returns an empty object for any non-plain-object value.
 */
export function parseRequirementSettings(raw: unknown): RequirementSettings {
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
        return raw as RequirementSettings;
    }
    return {};
}

/**
 * Returns true when the requirement is mandatory (default when no setting is stored).
 */
export function isRequirementRequired(req: string, settings: RequirementSettings): boolean {
    const setting = settings[req];
    if (setting === undefined) return true;
    return setting.isRequired;
}
