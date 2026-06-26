'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { physicalExaminationSchema, type PhysicalExaminationFormInput } from '@/schemas'
import { getDatabaseUserId } from '@/lib/database-helpers'
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

    // Check if user has permission to record physical examinations (for self or others)
    const dbUserId = await getDatabaseUserId(userId)
    if (!dbUserId) {
      return { success: false, error: 'User not found' }
    }

    const authDbUserId = await getDatabaseUserId(authUser.id)
    if (!authDbUserId) {
      return { success: false, error: 'You do not have permission to record physical examinations' }
    }

    // Check if user has explicit permission to edit physical examinations
    const hasPermission = await prisma.userPermission.findFirst({
      where: {
        userId: authDbUserId,
        Permission: {
          isActive: true,
          deletedAt: null,
          name: {
            in: isOwn
              ? ['update:user:profile:own', 'update:patient:health-record:own', 'super_admin']
              : ['update:clinic:patient:all', 'update:patient:health-record:any', 'super_admin']
          }
        }
      },
    })

    if (!hasPermission) {
      const permissionNeeded = isOwn ? 'to record your own physical examinations' : 'to record physical examinations for other users'
      return { success: false, error: `You do not have permission ${permissionNeeded}` }
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

    // Find the latest VitalSign for this user and update it with visual acuity data,
    // or create a new VitalSign record if none exists
    const latestVitalSign = await prisma.vitalSign.findFirst({
      where: { userId: dbUserId, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    let vitalSign
    if (latestVitalSign) {
      vitalSign = await prisma.vitalSign.update({
        where: { id: latestVitalSign.id },
        data: {
          visualAcuityLeft: validatedInput.visualAcuityLeft,
          visualAcuityRight: validatedInput.visualAcuityRight,
        },
      })
    } else {
      vitalSign = await prisma.vitalSign.create({
        data: {
          userId: dbUserId,
          dateTaken: new Date(),
          visualAcuityLeft: validatedInput.visualAcuityLeft,
          visualAcuityRight: validatedInput.visualAcuityRight,
        },
      })
    }

    await logAudit({
      entityType: AuditEntityType.PHYSICAL_EXAM,
      entityId: vitalSign.id.toString(),
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
      examinationId: vitalSign.id,
    }
  } catch (error) {
    console.error('[ADD_PHYSICAL_EXAMINATION_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
