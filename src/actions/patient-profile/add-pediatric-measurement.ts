'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { pediatricMeasurementSchema, type PediatricMeasurementFormInput } from '@/schemas'
import { userCanEditSection } from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType } from '@/lib/audit-logger'
import { evaluateMUAC } from '@/schemas/pediatric-measurement-schema'

export interface AddPediatricMeasurementResponse {
  success: boolean
  error?: string
  message?: string
  measurementId?: number
}

export async function addPediatricMeasurement(
  userId: string,
  input: PediatricMeasurementFormInput
): Promise<AddPediatricMeasurementResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    if (!userCanEditSection(authUser.id, userId, UserRole.HEALTHCARE_PROVIDER, 'pediatric-measurements')) {
      return { success: false, error: 'You do not have permission to record pediatric measurements' }
    }

    let validatedInput: PediatricMeasurementFormInput
    try {
      validatedInput = pediatricMeasurementSchema.parse(input)
    } catch (validationError: any) {
      const fieldErrors = validationError.flatten?.().fieldErrors || {}
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]: [string, any]) =>
          `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`
        )
        .join('; ')
      return { success: false, error: `Validation failed: ${errorMessages}` }
    }

    const muacStatus = validatedInput.midUpperArmCircumference
      ? evaluateMUAC(Number(validatedInput.midUpperArmCircumference))
      : null

    const measurement = await prisma.pediatricMeasurement.create({
      data: {
        userId: parseInt(userId),
        dateTaken: validatedInput.dateTaken,
        length: validatedInput.length,
        headCircumference: validatedInput.headCircumference,
        skinfoldThickness: validatedInput.skinfoldThickness,
        waistCircumference: validatedInput.waistCircumference,
        hipCircumference: validatedInput.hipCircumference,
        limbCircumference: validatedInput.limbCircumference,
        midUpperArmCircumference: validatedInput.midUpperArmCircumference,
        remarks: validatedInput.remarks,
      },
    })

    await logAudit({
      entityType: AuditEntityType.PEDIATRIC_MEASUREMENT,
      entityId: measurement.id.toString(),
      action: AuditAction.CREATE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      metadata: {
        muacStatus,
        source: 'addPediatricMeasurement',
      },
    })

    return {
      success: true,
      message: `Measurement recorded successfully${muacStatus ? ` (MUAC: ${muacStatus})` : ''}`,
      measurementId: measurement.id,
    }
  } catch (error) {
    console.error('[ADD_PEDIATRIC_MEASUREMENT_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
