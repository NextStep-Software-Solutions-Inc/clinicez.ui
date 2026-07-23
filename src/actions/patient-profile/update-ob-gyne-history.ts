'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { obGyneHistorySchema, type ObGyneHistoryFormInput } from '@/schemas'
import { userCanEditSection } from '@/lib/permissions'
import { getDatabaseUserId } from '@/lib/database-helpers'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType, trackChanges } from '@/lib/audit-logger'
import { validateObGyneConsistency } from '@/schemas/ob-gyne-history-schema'

export interface UpdateObGyneHistoryResponse {
  success: boolean
  error?: string
  message?: string
}

export async function updateObGyneHistory(
  userId: string,
  input: ObGyneHistoryFormInput
): Promise<UpdateObGyneHistoryResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    // Get target user's database ID
    const dbUserId = await getDatabaseUserId(userId)
    if (!dbUserId) {
      return { success: false, error: 'User not found' }
    }

    const user = await prisma.user.findUnique({
      where: { id: dbUserId },
      select: { gender: true },
    })

    if (user?.gender !== 'FEMALE') {
      return { success: false, error: 'This form is only for patients with female gender' }
    }

    const isOwn = authUser.id === userId
    // Bypass permissions as requested
    // if (
    //   !userCanEditSection(authUser.id, userId, UserRole.PATIENT, 'ob-gyne') &&
    //   !userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'ob-gyne') &&
    //   !userCanEditSection(authUser.id, userId, UserRole.CLINIC_ADMIN, 'ob-gyne')
    // ) {
    //   return { success: false, error: 'You do not have permission to update OB-Gyn history' }
    // }

    let validatedInput: ObGyneHistoryFormInput
    try {
      validatedInput = obGyneHistorySchema.parse(input)
    } catch (validationError: any) {
      const fieldErrors = validationError.flatten?.().fieldErrors || {}
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]: [string, any]) =>
          `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`
        )
        .join('; ')
      return { success: false, error: `Validation failed: ${errorMessages}` }
    }

    const consistencyErrors = validateObGyneConsistency(validatedInput)
    if (consistencyErrors.length > 0) {
      return { success: false, error: consistencyErrors[0] }
    }

    const currentRecord = await prisma.obGyneHistory.findUnique({
      where: { userId: dbUserId },
    })

    let action = AuditAction.CREATE
    if (currentRecord) {
      action = AuditAction.UPDATE
      await prisma.obGyneHistory.update({
        where: { userId: dbUserId },
        data: validatedInput as any,
      })
    } else {
      await prisma.obGyneHistory.create({
        data: { userId: dbUserId, ...validatedInput } as any,
      })
    }

    if (currentRecord) {
      const changes = trackChanges(currentRecord, validatedInput)
      await logAudit({
        entityType: AuditEntityType.OB_GYNE_HISTORY,
        entityId: userId,
        action,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        changes,
        metadata: { source: 'updateObGyneHistory' },
      })
    } else {
      await logAudit({
        entityType: AuditEntityType.OB_GYNE_HISTORY,
        entityId: userId,
        action: AuditAction.CREATE,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        metadata: { source: 'updateObGyneHistory' },
      })
    }

    const message = currentRecord ? 'OB-Gyn history updated successfully' : 'OB-Gyn history added successfully'
    return { success: true, message }
  } catch (error) {
    console.error('[UPDATE_OB_GYNE_HISTORY_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
