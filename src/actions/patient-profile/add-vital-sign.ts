'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { vitalSignSchema, type VitalSignFormInput } from '@/schemas'
import { getDatabaseUserId } from '@/lib/permissions'
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

    // Check if user has permission to record vital signs (for self or others)
    const dbUserId = await getDatabaseUserId(userId)
    if (!dbUserId) {
      return { success: false, error: 'User not found' }
    }
    
    const authDbUserId = await getDatabaseUserId(authUser.id)
    if (!authDbUserId) {
      return { success: false, error: 'You do not have permission to record vital signs' }
    }

    // Check if user has explicit permission to edit vital signs
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
      const permissionNeeded = isOwn ? 'to edit your own vital signs' : 'to edit vital signs for other users'
      return { success: false, error: `You do not have permission ${permissionNeeded}` }
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

    // Create new vital sign record
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
    if (error instanceof Error) {
      console.error('[ADD_VITAL_SIGN_ERROR] Message:', error.message)
    }
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
