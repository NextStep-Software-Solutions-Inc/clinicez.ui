/**
 * Audit Logging Utility for Health Records
 * Tracks all changes for compliance and accountability
 * User-centric: Non-technical, clear change descriptions
 */

import prisma from '@/lib/prisma'

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
}

export enum AuditEntityType {
  USER = 'USER',
  VITAL_SIGN = 'VITAL_SIGN',
  PHYSICAL_EXAM = 'PHYSICAL_EXAM',
  PERSONAL_HISTORY = 'PERSONAL_HISTORY',
  OB_GYNE_HISTORY = 'OB_GYNE_HISTORY',
  PEDIATRIC_MEASUREMENT = 'PEDIATRIC_MEASUREMENT',
  MEDICAL_HISTORY = 'MEDICAL_HISTORY',
  FAMILY_MEDICAL_HISTORY = 'FAMILY_MEDICAL_HISTORY',
  PHILHEALTH_RECORD = 'PHILHEALTH_RECORD',
}

export interface AuditLogEntry {
  entityType: AuditEntityType
  entityId: string | number
  action: AuditAction
  performedBy: string // User ID
  targetUser?: string // If editing someone else's record
  changes?: Record<string, { old: any; new: any }>
  reason?: string
  metadata?: Record<string, any>
}

export interface AuditResult {
  success: boolean
  logId?: string
  error?: string
}

/**
 * Log an action to the audit trail
 * User-centric: Tracks who changed what, when, and why
 */
export async function logAudit(entry: AuditLogEntry): Promise<AuditResult> {
  try {
    // In a real implementation, this would write to a dedicated audit table
    // For now, we'll log to console and can integrate with database later

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      ...entry,
    }

    // TODO: Integrate with actual audit database table
    // const auditLog = await prisma.auditLog.create({
    //   data: {
    //     entityType: entry.entityType,
    //     entityId: String(entry.entityId),
    //     action: entry.action,
    //     performedBy: entry.performedBy,
    //     targetUser: entry.targetUser,
    //     changes: entry.changes ? JSON.stringify(entry.changes) : null,
    //     reason: entry.reason,
    //     metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    //   },
    // })

    console.log('[AUDIT LOG]', JSON.stringify(logEntry, null, 2))

    return {
      success: true,
      logId: `audit-${timestamp}`,
    }
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error)
    return {
      success: false,
      error: 'Failed to log audit entry',
    }
  }
}

/**
 * Helper: Get user-friendly description of what changed
 */
export function getChangeDescription(
  entityType: AuditEntityType,
  action: AuditAction,
  changes?: Record<string, { old: any; new: any }>
): string {
  const entityNames: Record<AuditEntityType, string> = {
    [AuditEntityType.USER]: 'Profile',
    [AuditEntityType.VITAL_SIGN]: 'Vital Signs',
    [AuditEntityType.PHYSICAL_EXAM]: 'Physical Examination',
    [AuditEntityType.PERSONAL_HISTORY]: 'Personal History',
    [AuditEntityType.OB_GYNE_HISTORY]: 'OB/Gyn History',
    [AuditEntityType.PEDIATRIC_MEASUREMENT]: 'Pediatric Measurement',
    [AuditEntityType.MEDICAL_HISTORY]: 'Medical History',
    [AuditEntityType.FAMILY_MEDICAL_HISTORY]: 'Family Medical History',
    [AuditEntityType.PHILHEALTH_RECORD]: 'PhilHealth Record',
  }

  const actionNames: Record<AuditAction, string> = {
    [AuditAction.CREATE]: 'Added',
    [AuditAction.UPDATE]: 'Updated',
    [AuditAction.DELETE]: 'Deleted',
    [AuditAction.VIEW]: 'Viewed',
    [AuditAction.EXPORT]: 'Exported',
  }

  const entityName = entityNames[entityType] || entityType
  const actionName = actionNames[action] || action

  if (changes && Object.keys(changes).length > 0) {
    const changedFields = Object.keys(changes)
    return `${actionName} ${entityName} (${changedFields.join(', ')})`
  }

  return `${actionName} ${entityName}`
}

/**
 * Helper: Track field changes for detailed audit
 */
export function trackChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {}

  // Check for updated fields
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      }
    }
  }

  return changes
}
