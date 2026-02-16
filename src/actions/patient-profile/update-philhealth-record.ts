'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { philHealthRecordSchema, type PhilHealthRecordFormInput } from '@/schemas'
import { userCanEditSection } from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType, trackChanges } from '@/lib/audit-logger'

export interface UpdatePhilhealthRecordResponse {
  success: boolean
  error?: string
  message?: string
}

export async function updatePhilhealthRecord(
  userId: string,
  input: PhilHealthRecordFormInput
): Promise<UpdatePhilhealthRecordResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    if (!userCanEditSection(authUser.id, userId, UserRole.PATIENT, 'philhealth')) {
      if (!userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'philhealth')) {
        return { success: false, error: 'You do not have permission to update PhilHealth information' }
      }
    }

    let validatedInput: PhilHealthRecordFormInput
    try {
      validatedInput = philHealthRecordSchema.parse(input)
    } catch (validationError: any) {
      const fieldErrors = validationError.flatten?.().fieldErrors || {}
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]: [string, any]) => 
          `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`
        )
        .join('; ')
      return { success: false, error: `Validation failed: ${errorMessages}` }
    }

    const currentRecord = await prisma.philHealthRecord.findFirst({
      where: { userId: parseInt(userId) },
    })

    const updateData = {
      pin: validatedInput.pin,
      tin: validatedInput.tin,
      philSysId: validatedInput.philSysId,
      memberTypeId: validatedInput.memberTypeId,
    }

    let action = AuditAction.CREATE
    if (currentRecord) {
      action = AuditAction.UPDATE
      await prisma.philHealthRecord.update({
        where: { id: currentRecord.id },
        data: updateData as any,
      })
    } else {
      await prisma.philHealthRecord.create({
        data: {
          userId: parseInt(userId),
          ...updateData,
        } as any,
      })
    }

    if (currentRecord) {
      const changes = trackChanges(currentRecord, validatedInput)
      await logAudit({
        entityType: AuditEntityType.PHILHEALTH_RECORD,
        entityId: userId,
        action,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        changes,
        metadata: { pin: validatedInput.pin, source: 'updatePhilhealthRecord' },
      })
    } else {
      await logAudit({
        entityType: AuditEntityType.PHILHEALTH_RECORD,
        entityId: userId,
        action: AuditAction.CREATE,
        performedBy: authUser.id,
        targetUser: !isOwn ? userId : undefined,
        metadata: { pin: validatedInput.pin, source: 'updatePhilhealthRecord' },
      })
    }

    const message = currentRecord ? 'PhilHealth information updated successfully' : 'PhilHealth information added successfully'
    return { success: true, message }
  } catch (error) {
    console.error('[UPDATE_PHILHEALTH_RECORD_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
