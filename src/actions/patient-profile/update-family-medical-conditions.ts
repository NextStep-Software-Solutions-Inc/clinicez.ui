'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { familyMedicalHistorySchema, type FamilyMedicalHistoryFormInput } from '@/schemas'
import { userCanEditSection } from '@/lib/permissions'
import { getDatabaseUserId } from '@/lib/database-helpers'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType } from '@/lib/audit-logger'

export interface UpdateFamilyMedicalConditionsResponse {
  success: boolean
  error?: string
  message?: string
  addedCount?: number
  removedCount?: number
}

export async function updateFamilyMedicalConditions(
  userId: string,
  input: { conditions: FamilyMedicalHistoryFormInput[] }
): Promise<UpdateFamilyMedicalConditionsResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    if (!userCanEditSection(authUser.id, userId, UserRole.PATIENT, 'family-history')) {
      if (!userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'family-history')) {
        return { success: false, error: 'You do not have permission to update family medical history' }
      }
    }

    let validatedConditions: FamilyMedicalHistoryFormInput[] = []
    try {
      for (const condition of input.conditions) {
        const validated = familyMedicalHistorySchema.parse(condition)
        validatedConditions.push(validated)
      }
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

    const currentConditions = await prisma.familyMedicalHistory.findMany({
      where: { userId: dbUserId },
      select: { id: true, conditionId: true, details: true },
    })

    const currentConditionIds = new Set(currentConditions.map((c: any) => c.conditionId))
    const newConditionIds = new Set(validatedConditions.map((c: any) => c.conditionId))

    // Separate into: add (new), remove (deleted), and update (existing with changed details)
    const toAdd = validatedConditions.filter((c: any) => !currentConditionIds.has(c.conditionId))
    const toRemove = currentConditions.filter((c: any) => !newConditionIds.has(c.conditionId))
    const toUpdate = validatedConditions.filter((c: any) => {
      const existing = currentConditions.find((existing: any) => existing.conditionId === c.conditionId)
      return existing && existing.details !== c.details
    })

    let addedCount = 0
    for (const condition of toAdd) {
      await prisma.familyMedicalHistory.create({
        data: {
          userId: dbUserId,
          conditionId: condition.conditionId,
          details: condition.details,
        },
      })
      addedCount++
    }

    let updatedCount = 0
    for (const condition of toUpdate) {
      const existing = currentConditions.find((c: any) => c.conditionId === condition.conditionId)
      if (existing) {
        await prisma.familyMedicalHistory.update({
          where: { id: existing.id },
          data: {
            details: condition.details,
          },
        })
        updatedCount++
      }
    }

    let removedCount = 0
    for (const condition of toRemove) {
      await prisma.familyMedicalHistory.delete({
        where: { id: condition.id },
      })
      removedCount++
    }

    if (addedCount > 0 || removedCount > 0 || updatedCount > 0) {
      await logAudit({
        entityType: AuditEntityType.FAMILY_MEDICAL_HISTORY,
        entityId: userId,
        action: addedCount > 0 || updatedCount > 0 ? AuditAction.UPDATE : AuditAction.DELETE,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        metadata: { addedCount, updatedCount, removedCount, source: 'updateFamilyMedicalConditions' },
      })
    }

    const message = []
    if (addedCount > 0) message.push(`Added ${addedCount} family condition(s)`)
    if (updatedCount > 0) message.push(`Updated ${updatedCount} family condition(s)`)
    if (removedCount > 0) message.push(`Removed ${removedCount} family condition(s)`)

    return {
      success: true,
      message: message.length > 0 ? message.join(', ') : 'Family medical history unchanged',
      addedCount,
      removedCount,
    }
  } catch (error) {
    console.error('[UPDATE_FAMILY_MEDICAL_CONDITIONS_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
