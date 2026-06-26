/**
 * Role-Based Permission System
 * User-centric design: Clear permission levels with appropriate field restrictions
 *
 * This implements principle of least privilege - users only see/edit what they need
 */

export enum EditPermissionLevel {
  /** Patient editing their own records */
  SELF_EDIT = "SELF_EDIT",
  /** Healthcare provider editing patient records with patient consent */
  PROFESSIONAL_EDIT = "PROFESSIONAL_EDIT",
  /** Clinic staff with authorized access */
  CLINIC_ADMIN_EDIT = "CLINIC_ADMIN_EDIT",
  /** Read-only access - no editing allowed */
  READONLY = "READONLY",
  /** No access */
  DENIED = "DENIED",
}

/**
 * Role types in system
 */
export enum UserRole {
  PATIENT = "PATIENT",
  HEALTHCARE_PROVIDER = "HEALTHCARE_PROVIDER",
  CLINIC_ADMIN = "CLINIC_ADMIN",
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
}

/**
 * Field-level edit permissions
 * Defines which roles can edit specific fields
 */
export interface FieldEditPermission {
  fieldName: string
  label: string
  allowedRoles: EditPermissionLevel[]
  readOnlyFor: EditPermissionLevel[]
  helpText?: string
}

/**
 * Demographics field permissions
 * User-centric: Patients can edit most, providers verify/update, read-only users see everything
 */
export const demographicsFieldPermissions: FieldEditPermission[] = [
  {
    fieldName: "firstName",
    label: "First Name",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "Your legal first name",
  },
  {
    fieldName: "middleName",
    label: "Middle Name",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "lastName",
    label: "Last Name",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "Your legal last name",
  },
  {
    fieldName: "suffix",
    label: "Suffix",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "e.g., Jr., Sr., III",
  },
  {
    fieldName: "nickname",
    label: "Nickname/Preferred Name",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "dob",
    label: "Date of Birth",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "System calculates your age automatically",
  },
  {
    fieldName: "gender",
    label: "Gender",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "bloodType",
    label: "Blood Type",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "Important for emergency medical care",
  },
  {
    fieldName: "civilStatus",
    label: "Civil Status",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "mobile",
    label: "Mobile Number",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "Keep this updated for appointment notifications",
  },
  {
    fieldName: "telephone",
    label: "Landline/Telephone",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "placeOfBirth",
    label: "Place of Birth",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "nationality",
    label: "Nationality",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
  },
  {
    fieldName: "religion",
    label: "Religion",
    allowedRoles: [EditPermissionLevel.SELF_EDIT, EditPermissionLevel.PROFESSIONAL_EDIT],
    readOnlyFor: [EditPermissionLevel.READONLY],
    helpText: "Optional - for cultural sensitivity in care",
  },
]

/**
 * Permission matrix by role
 * Determines what each role can do
 */
export const permissionMatrix: Record<EditPermissionLevel, Set<string>> = {
  [EditPermissionLevel.SELF_EDIT]: new Set([
    "demographics",
    "vitals",
    "personal-history",
    "medical-history",
    "family-history",
    "pediatric-measurements",
    "ob-gyne",
  ]),
  [EditPermissionLevel.PROFESSIONAL_EDIT]: new Set([
    "demographics",
    "vitals",
    "physical-exam",
    "personal-history",
    "medical-history",
    "family-history",
    "ob-gyne",
    "pediatric-measurements",
  ]),
  [EditPermissionLevel.CLINIC_ADMIN_EDIT]: new Set([
    "all", // Can edit most things except contact info
  ]),
  [EditPermissionLevel.READONLY]: new Set([]), // Cannot edit anything
  [EditPermissionLevel.DENIED]: new Set([]), // No access
}

/**
 * Helper function: Check if role can edit field
 * User-centric: Returns boolean for permission checks
 */
export function canEditField(
  permission: EditPermissionLevel,
  fieldName: string,
  fieldPermissions: FieldEditPermission[]
): boolean {
  const field = fieldPermissions.find((f) => f.fieldName === fieldName)
  if (!field) return false
  return field.allowedRoles.includes(permission)
}

/**
 * Helper function: Check if role can edit section
 * User-centric: Used for showing/hiding entire edit sections
 */
export function canEditSection(
  permission: EditPermissionLevel,
  sectionName: string
): boolean {
  const allowedSections = permissionMatrix[permission] || new Set()
  if (allowedSections.has("all")) return true
  return allowedSections.has(sectionName)
}

/**
 * Helper function: Get all editable sections for permission level
 * User-centric: Used to filter UI and show available edits
 */
export function getEditableSections(permission: EditPermissionLevel): string[] {
  const allowedSections = permissionMatrix[permission] || new Set()
  if (allowedSections.has("all")) {
    return [
      "demographics",
      "vitals",
      "physical-exam",
      "personal-history",
      "medical-history",
      "family-history",
      "ob-gyne",
      "pediatric-measurements",
      "insurance",
    ]
  }
  return Array.from(allowedSections)
}

/**
 * Helper function: Format permission level for display
 * User-centric: Human-readable permission labels
 */
export const permissionLabels: Record<EditPermissionLevel, string> = {
  [EditPermissionLevel.SELF_EDIT]: "You can edit your health information",
  [EditPermissionLevel.PROFESSIONAL_EDIT]: "Healthcare provider access",
  [EditPermissionLevel.CLINIC_ADMIN_EDIT]: "Clinic administration",
  [EditPermissionLevel.READONLY]: "View only - cannot edit",
  [EditPermissionLevel.DENIED]: "No access",
}

/**
 * Helper function: Determine permission level from user role
 * User-centric: Simple role-to-permission mapping
 */
export function determineEditPermission(
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole
): EditPermissionLevel {
  // No authentication = no access
  if (!currentUserId) return EditPermissionLevel.DENIED

  // Patient viewing own record
  if (currentUserId === targetUserId && userRole === UserRole.PATIENT) {
    return EditPermissionLevel.SELF_EDIT
  }

  // Healthcare provider
  if (userRole === UserRole.HEALTHCARE_PROVIDER) {
    return EditPermissionLevel.PROFESSIONAL_EDIT
  }

  // Clinic admin
  if (userRole === UserRole.CLINIC_ADMIN) {
    return EditPermissionLevel.CLINIC_ADMIN_EDIT
  }

  // System admin - full access
  if (userRole === UserRole.SYSTEM_ADMIN) {
    return EditPermissionLevel.PROFESSIONAL_EDIT
  }

  // Default: read-only
  return EditPermissionLevel.READONLY
}

/**
 * Helper function: Check if user is editing their own record
 * User-centric: Important for self-edit workflows
 */
export function isEditingSelfRecord(currentUserId: string | null, targetUserId: string | null): boolean {
  return currentUserId === targetUserId && currentUserId !== null
}
