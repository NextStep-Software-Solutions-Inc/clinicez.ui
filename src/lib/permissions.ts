export const PERMISSIONS = {
  USER: {
    "UPSERT:USER-PREFERENCE:OWN": {
      name: "upsert:user-preference:own",
      description: "User can update their own user preference.",
    },
    "UPDATE:USER:PERMISSIONS": {
      name: "update:user:permissions",
      description: "User can update the permissions.",
    },
    "SUPER_ADMIN": {
      name: "super_admin",
      description: "User has super admin privileges.",
    },
    "UPDATE:USER:PROFILE:OWN": {
      name: "update:user:profile:own",
      description: "User can update their own profile information.",
    },
    "UPDATE:USER:PROFILE:ANY": {
      name: "update:user:profile:any",
      description: "User can update any user's profile information (admin/superadmin).",
    },
    "UPDATE:USER:ONBOARDING_STATUS": {
      name: "update:user:onboarding_status",
      description: "User can update onboarding status for users.",
    },
    "COMPLETE:USER:ONBOARDING_STEP": {
      name: "complete:user:onboarding_step",
      description: "User can complete onboarding steps.",
    },
    "CLAIM:USER:SHELL_ACCOUNT": {
      name: "claim:user:shell_account",
      description: "User can claim a shell account and convert it to a full account.",
    },
    "VIEW:USER:ONBOARDING_STATUS": {
      name: "view:user:onboarding_status",
      description: "User can view onboarding status and steps.",
    },
  },
  CLINIC: {
    "CONFIRM:CLINIC:APPOINTMENT": {
      name: "confirm:clinic:appointment",
      description: "User can confirm appointment within the clinic.",
    },
    "ASSIGN:CLINIC:APPOINTMENT": {
      name: "assign:clinic:appointment",
      description: "User can assign appointment to another user within then clinic.",
    },
    "DECLINE:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "decline:clinic:appointment_assignment",
      description: "User can decline appointment assignment within the clinic.",
    },
    "CANCEL:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "cancel:clinic:appointment_assignment",
      description: "User can cancel appointment assignment within the clinic.",
    },
    "RETURN:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "return:clinic:appointment_assignment",
      description: "User can return accepted appointment assignment within the clinic.",
    },
    "ACCEPT:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "accept:clinic:appointment_assignment",
      description: "User can accept appointment assignment within the clinic.",
    },
    "WRITE:CLINIC:APPOINTMENT": {
      name: "write:clinic:appointment",
      description: "User can write appointment within the clinic.",
    },
    "READ:CLINIC:APPOINTMENT:ALL": {
      name: "read:clinic:appointment:all",
      description: "User can read all appointment within the clinic.",
    },
    "READ:CLINIC:APPOINTMENT:OWN": {
      name: "read:clinic:appointment:own",
      description: "User can read their own appointment within the clinic.",
    },
    "READ:CLINIC:APPOINTMENT:ASSIGNED": {
      name: "read:clinic:appointment:assigned",
      description: "User can read appointment assigned to them within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:ALL": {
      name: "read:clinic:consultation_ticket:all",
      description: "User can read all consultation ticket within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:OWN": {
      name: "read:clinic:consultation_ticket:own",
      description: "User can read their own consultation ticket within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "read:clinic:consultation_ticket:created",
      description: "User can read consultation ticket created by them within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "read:clinic:consultation_ticket:co_created",
      description: "User can read consultation ticket co-created by them within the clinic.",
    },
    "UPDATE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "update:clinic:consultation_ticket:created",
      description: "User can update consultation ticket created by them within the clinic.",
    },
    "UPDATE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "update:clinic:consultation_ticket:co_created",
      description: "User can update consultation ticket co-created by them within the clinic.",
    },
    "DELETE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "delete:clinic:consultation_ticket:created",
      description: "User can delete consultation ticket created by them within the clinic.",
    },
    "DELETE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "delete:clinic:consultation_ticket:co_created",
      description: "User can delete consultation ticket co-created by them within the clinic.",
    },
    "RESOLVE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "resolve:clinic:consultation_ticket:created",
      description: "User can resolve consultation ticket created by them within the clinic.",
    },
    "RESOLVE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "resolve:clinic:consultation_ticket:co_created",
      description: "User can resolve consultation ticket co-created by them within the clinic.",
    },
    "TOGGLE_ARCHIVE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "toggle_archive:clinic:consultation_ticket:created",
      description: "User can archive consultation ticket created by them within the clinic.",
    },
    "TOGGLE_ARCHIVE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "toggle_archive:clinic:consultation_ticket:co_created",
      description: "User can archive consultation ticket co-created by them within the clinic.",
    },
    "CREATE:CLINIC:CONSULTATION_TICKET": {
      name: "create:clinic:consultation_ticket",
      description: "User can create consultation ticket within the clinic.",
    },
    "ADD:CLINIC:CONSULTATION_TICKET:HP": {
      name: "add:clinic:consultation_ticket:hp",
      description: "User can add healthcare provider to consultation ticket within the clinic.",
    },
    "WRITE:CLINIC:PRE_ASSESSMENT_NOTE": {
      name: "write:clinic:pre_assessment_note",
      description: "User can write pre-assessment note within the clinic. This permission can be granted to any healthcare provider role (nurses, medical assistants, doctors, etc.) based on clinic workflow.",
    },
    "READ:CLINIC:PRE_ASSESSMENT_NOTE": {
      name: "read:clinic:pre_assessment_note",
      description: "User can read pre-assessment note within the clinic.",
    },
    "RECEIVE:CLINIC:APPOINTMENT": {
      name: "receive:clinic:appointment",
      description: "User can receive appointment within the clinic.",
    },
    "COMPLETE:CLINIC:APPOINTMENT": {
      name: "complete:clinic:appointment",
      description: "User can complete appointment within the clinic.",
    },
    "REJECT:CLINIC:APPOINTMENT": {
      name: "reject:clinic:appointment",
      description: "User can reject appointment within the clinic.",
    },
    "WRITE:CLINIC:VITAL_SIGNS": {
      name: "write:clinic:vital_signs",
      description: "User can write vital signs within the clinic.",
    },
    "RESCHEDULE:CLINIC:APPOINTMENT": {
      name: "reschedule:clinic:appointment",
      description: "User can reschedule appointment within the clinic.",
    },
    "WRITE:CLINIC:APPOINTMENT:BOOK_A_FRIEND": {
      name: "write:clinic:appointment:book_a_friend",
      description: "User can write appointment for a friend within the clinic.",
    },
    "READ:CLINIC:MEDICATION:ALL": {
      name: "read:clinic:medication:all",
      description: "User can read all medication within the clinic.",
    },
    "READ:CLINIC:MEDICATION:OWN": {
      name: "read:clinic:medication:own",
      description: "User can read their own medication within the clinic.",
    },
    "READ:CLINIC:MEDICATION:CREATED": {
      name: "read:clinic:medication:created",
      description: "User can read medication created by them within the clinic.",
    },
    "COMPLETE:CLINIC:MEDICATION": {
      name: "complete:clinic:medication",
      description: "User can complete medication within the clinic.",
    },
    "CREATE:CLINIC:MEDICATION": {
      name: "create:clinic:medication",
      description: "User can create medication within the clinic.",
    },
    "REMOVE:CLINIC:MEDICATION_DRUG": {
      name: "remove:clinic:medication_drug",
      description: "User can remove medication drug within the clinic.",
    },
    "ADD:CLINIC:MEDICATION_DRUG": {
      name: "add:clinic:medication_drug",
      description: "User can add medication drug within the clinic.",
    },
    "READ:CLINIC:MEDICATION_DRUG": {
      name: "read:clinic:medication_drug",
      description: "User can read medication drug within the clinic.",
    },
    "CREATE:CLINIC:PRESCRIPTION": {
      name: "create:clinic:prescription",
      description: "User can create prescription within the clinic.",
    },
    "UPDATE:CLINIC:PERMISSIONS": {
      name: "update:clinic:permissions",
      description: "User can update permissions within the clinic.",
    },
    "CREATE:CLINIC:PATIENT": {
      name: "create:clinic:patient",
      description: "User can create and add new patients to the clinic.",
    },
    "READ:CLINIC:PATIENT:ALL": {
      name: "read:clinic:patient:all",
      description: "User can read all patient records within the clinic.",
    },
    "READ:CLINIC:PATIENT:OWN": {
      name: "read:clinic:patient:own",
      description: "User can read their own patient record within the clinic.",
    },
    "UPDATE:CLINIC:PATIENT:ALL": {
      name: "update:clinic:patient:all",
      description: "User can update any patient record within the clinic.",
    },
    "UPDATE:CLINIC:PATIENT:OWN": {
      name: "update:clinic:patient:own",
      description: "User can update their own patient record within the clinic.",
    },
    "UPDATE:CLINIC:PATIENT:ONBOARDING_STATUS": {
      name: "update:clinic:patient:onboarding_status",
      description: "User can update patient onboarding status within the clinic.",
    },
    "COMPLETE:CLINIC:PATIENT:ONBOARDING": {
      name: "complete:clinic:patient:onboarding",
      description: "User can complete patient onboarding process within the clinic.",
    },
    "VIEW:CLINIC:AUDIT_LOG": {
      name: "view:clinic:audit_log",
      description: "User can view audit logs within the clinic.",
    },
  },
  ORGANIZATION: {
    "UPDATE:ORG:INFO": {
      name: "update:org:info",
      description: "User can update organization information and settings.",
    },
    "READ:ORG:MEMBERS": {
      name: "read:org:members",
      description: "User can read and view organization members.",
    },
    "CREATE:ORG:MEMBERS": {
      name: "create:org:members",
      description: "User can create and invite new organization members.",
    },
    "UPDATE:ORG:MEMBERS": {
      name: "update:org:members",
      description: "User can update organization member status, roles, and assignments.",
    },
    "DELETE:ORG:MEMBERS": {
      name: "delete:org:members",
      description: "User can delete and remove organization members.",
    },
    "UPDATE:ORG:PERMISSIONS": {
      name: "update:org:permissions",
      description: "User can update permissions within the organization.",
    },
  },
}

/**
 * ============================================================================
 * HEALTH RECORDS EDITING - ROLE-BASED PERMISSION UTILITIES
 * ============================================================================
 * User-centric: Safe, easy-to-use helpers for permission checks throughout the app
 */

import type {
  EditPermissionLevel,
  FieldEditPermission,
} from '@/types/edit-permissions'
import {
  UserRole,
  canEditField,
  canEditSection,
  getEditableSections,
  determineEditPermission,
  isEditingSelfRecord,
  demographicsFieldPermissions,
} from '@/types/edit-permissions'

/**
 * Check if current user can edit a specific field
 * User-centric: Safe function with fallback to read-only
 */
export function userCanEditField(
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole,
  fieldName: string,
  fieldPermissions: FieldEditPermission[] = demographicsFieldPermissions
): boolean {
  const permission = determineEditPermission(currentUserId, targetUserId, userRole)
  return canEditField(permission, fieldName, fieldPermissions)
}

/**
 * Check if current user can edit an entire section
 * User-centric: Used to show/hide edit buttons and sections
 */
export function userCanEditSection(
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole,
  sectionName: string
): boolean {
  const permission = determineEditPermission(currentUserId, targetUserId, userRole)
  return canEditSection(permission, sectionName)
}

/**
 * Get list of sections user can edit
 * User-centric: Used to render edit UI conditionally
 */
export function getUserEditableSections(
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole
): string[] {
  const permission = determineEditPermission(currentUserId, targetUserId, userRole)
  return getEditableSections(permission)
}

/**
 * Check if user is editing their own profile
 * User-centric: Determine which messaging to show
 */
export function isUserEditingOwnProfile(
  currentUserId: string | null,
  targetUserId: string | null
): boolean {
  return isEditingSelfRecord(currentUserId, targetUserId)
}

/**
 * Get permission level for current user
 * User-centric: Used for logging, debugging, permission checks
 */
export function getUserPermissionLevel(
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole
): EditPermissionLevel {
  return determineEditPermission(currentUserId, targetUserId, userRole)
}

/**
 * Verify user has permission before showing edit UI
 * User-centric: Security check - called before rendering edit components
 */
export function verifyEditPermission(
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole,
  requiredPermission: EditPermissionLevel
): boolean {
  const actualPermission = determineEditPermission(currentUserId, targetUserId, userRole)
  
  // Permission hierarchy: more permissive = higher in list
  const permissionHierarchy = [
    'SELF_EDIT',
    'PROFESSIONAL_EDIT',
    'CLINIC_ADMIN_EDIT',
    'READONLY',
    'DENIED',
  ] as const
  
  const actualLevel = permissionHierarchy.indexOf(actualPermission as any)
  const requiredLevel = permissionHierarchy.indexOf(requiredPermission as any)
  
  // User has permission if their level is more or equally permissive
  return actualLevel <= requiredLevel
}

/**
 * Get help text for field based on permission level
 * User-centric: Explains why field is read-only or what user can do
 */
export function getFieldHelpText(
  fieldName: string,
  permission: EditPermissionLevel,
  fieldPermissions: FieldEditPermission[] = demographicsFieldPermissions
): string {
  const field = fieldPermissions.find((f) => f.fieldName === fieldName)
  if (!field) return ""
  
  if (canEditField(permission, fieldName, fieldPermissions)) {
    return field.helpText || ""
  }
  
  // Explain why field is read-only
  if (field.readOnlyFor.includes(permission)) {
    if (permission === 'READONLY' as any) {
      return "You have read-only access to this record"
    }
    if (permission === 'PROFESSIONAL_EDIT' as any) {
      return "This field can only be updated by the patient"
    }
  }
  
  return ""
}

/**
 * Log permission check for audit trail
 * User-centric: Security logging
 */
export function logPermissionCheck(
  action: string,
  currentUserId: string | null,
  targetUserId: string | null,
  userRole: UserRole,
  allowed: boolean
): void {
  const permission = determineEditPermission(currentUserId, targetUserId, userRole)
  const timestamp = new Date().toISOString()
  
  console.log(
    `[PERMISSION CHECK] ${timestamp} - Action: ${action}, Permission: ${permission}, Allowed: ${allowed}`
  )
  
  // In production, this would send to logging service
  // await logToAuditTrail({ action, currentUserId, targetUserId, userRole, permission, allowed, timestamp })
}