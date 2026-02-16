'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { vitalSignSchema, type VitalSignFormInput } from '@/schemas'
import { userCanEditSection, getDatabaseUserId } from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType } from '@/lib/audit-logger'

export interface AddVitalSignResponse {
  success: boolean
  error?: string
  message?: string
  vitalSignId?: number
}

export async function addVitalSign(
  userId: string,
  input: VitalSignFormInput
): Promise<AddVitalSignResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    if (!userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'vital-signs')) {
      return { success: false, error: 'You do not have permission to record vital signs' }
    }

    let validatedInput: VitalSignFormInput
    try {
      validatedInput = vitalSignSchema.parse(input)
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

    const vitalSign = await prisma.vitalSign.create({
      data: {
        userId: dbUserId,
        dateTaken: validatedInput.dateTaken,
        height: validatedInput.height,
        weight: validatedInput.weight,
        bpSystolic: validatedInput.bpSystolic,
        bpDiastolic: validatedInput.bpDiastolic,
        pulseRate: validatedInput.pulseRate,
        temp: validatedInput.temp,
        spo2: validatedInput.spo2,
        respRate: validatedInput.respRate,
        notes: validatedInput.notes,
      },
    })

    await logAudit({
      entityType: AuditEntityType.VITAL_SIGN,
      entityId: vitalSign.id.toString(),
      action: AuditAction.CREATE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      metadata: {
        height: validatedInput.height,
        weight: validatedInput.weight,
        source: 'addVitalSign',
      },
    })

    return {
      success: true,
      message: 'Vital signs recorded successfully',
      vitalSignId: vitalSign.id,
    }
  } catch (error) {
    console.error('[ADD_VITAL_SIGN_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
