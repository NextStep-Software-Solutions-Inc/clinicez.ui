'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { physicalExaminationSchema, type PhysicalExaminationFormInput } from '@/schemas'
import { userCanEditSection } from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType } from '@/lib/audit-logger'

export interface AddPhysicalExaminationResponse {
  success: boolean
  error?: string
  message?: string
  examinationId?: number
}

export async function addPhysicalExamination(
  userId: string,
  input: PhysicalExaminationFormInput
): Promise<AddPhysicalExaminationResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    if (!userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'physical-examination')) {
      if (!userCanEditSection(authUser.id, userId, UserRole.CLINIC_ADMIN, 'physical-examination')) {
        return { success: false, error: 'You do not have permission to record physical examinations' }
      }
    }

    let validatedInput: PhysicalExaminationFormInput
    try {
      validatedInput = physicalExaminationSchema.parse(input)
    } catch (validationError: any) {
      const fieldErrors = validationError.flatten?.().fieldErrors || {}
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]: [string, any]) =>
          `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`
        )
        .join('; ')
      return { success: false, error: `Validation failed: ${errorMessages}` }
    }

    const examination = await prisma.physicalExamination.create({
      data: {
        userId: parseInt(userId),
        visualAcuityLeft: validatedInput.visualAcuityLeft,
        visualAcuityRight: validatedInput.visualAcuityRight,
        status: validatedInput.status,
      },
    })

    await logAudit({
      entityType: AuditEntityType.PHYSICAL_EXAM,
      entityId: examination.id.toString(),
      action: AuditAction.CREATE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      metadata: {
        visualAcuityLeft: validatedInput.visualAcuityLeft,
        visualAcuityRight: validatedInput.visualAcuityRight,
        source: 'addPhysicalExamination',
      },
    })

    return {
      success: true,
      message: 'Physical examination recorded successfully',
      examinationId: examination.id,
    }
  } catch (error) {
    console.error('[ADD_PHYSICAL_EXAMINATION_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
