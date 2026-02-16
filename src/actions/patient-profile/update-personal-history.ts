'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { personalHistorySchema, type PersonalHistoryFormInput } from '@/schemas'
import { userCanEditSection, getDatabaseUserId } from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType, trackChanges } from '@/lib/audit-logger'

export interface UpdatePersonalHistoryResponse {
  success: boolean
  error?: string
  message?: string
}

export async function updatePersonalHistory(
  userId: string,
  input: PersonalHistoryFormInput
): Promise<UpdatePersonalHistoryResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    if (!userCanEditSection(authUser.id, userId, UserRole.PATIENT, 'personal-history')) {
      if (!userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'personal-history')) {
        return { success: false, error: 'You do not have permission to update personal history' }
      }
    }

    let validatedInput: PersonalHistoryFormInput
    try {
      validatedInput = personalHistorySchema.parse(input)
    } catch (validationError: any) {
      const fieldErrors = validationError.flatten?.().fieldErrors || {}
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]: [string, any]) =>
          `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`
        )
        .join('; ')
      return { success: false, error: `Validation failed: ${errorMessages}` }
    }

    // Get target user's database ID
    const dbUserId = await getDatabaseUserId(userId)
    if (!dbUserId) {
      return { success: false, error: 'User not found' }
    }

    const currentRecord = await prisma.personalHistory.findUnique({
      where: { userId: dbUserId },
    })

    let action = AuditAction.CREATE
    if (currentRecord) {
      action = AuditAction.UPDATE
      await prisma.personalHistory.update({
        where: { userId: dbUserId },
        data: validatedInput,
      })
    } else {
      await prisma.personalHistory.create({
        data: { userId: dbUserId, ...validatedInput },
      })
    }

    if (currentRecord && action === AuditAction.UPDATE) {
      const changes = trackChanges(currentRecord, validatedInput)
      await logAudit({
        entityType: AuditEntityType.PERSONAL_HISTORY,
        entityId: userId,
        action,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        changes,
        metadata: { source: 'updatePersonalHistory' },
      })
    } else {
      await logAudit({
        entityType: AuditEntityType.PERSONAL_HISTORY,
        entityId: userId,
        action: AuditAction.CREATE,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        metadata: { source: 'updatePersonalHistory' },
      })
    }

    const message = currentRecord ? 'Personal history updated successfully' : 'Personal history added successfully'
    return { success: true, message }
  } catch (error) {
    console.error('[UPDATE_PERSONAL_HISTORY_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
