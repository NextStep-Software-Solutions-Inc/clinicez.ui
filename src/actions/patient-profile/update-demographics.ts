'use server'

/**
 * Update User Demographics
 * Server action for updating patient profile information
 * User-centric: Validates all fields, checks permissions, logs changes
 */

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { demographicsSchema, type DemographicsFormInput } from '@/schemas'
import { 
  userCanEditField,
  getUserPermissionLevel,
} from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType, trackChanges } from '@/lib/audit-logger'

export interface UpdateDemographicsResponse {
  success: boolean
  error?: string
  message?: string
}

/**
 * Update user demographics (profile information)
 * Validates input, checks permissions, updates database, logs changes
 */
export async function updateDemographics(
  userId: string,
  input: Partial<DemographicsFormInput>
): Promise<UpdateDemographicsResponse> {
  try {
    // 1. Get current user (for permission checking)
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { 
        success: false, 
        error: 'You must be logged in to update profile information',
      }
    }

    // 2. Verify user is updating their own profile or has permission
    const isOwn = authUser.id === userId
    if (!isOwn) {
      // Check if current user has permission to edit others
      const permission = getUserPermissionLevel(
        authUser.id,
        userId,
        UserRole.HEALTHCARE_PROVIDER // Default to provider role for non-self edits
      )
      
      if (permission === 'READONLY' || permission === 'DENIED') {
        return {
          success: false,
          error: 'You do not have permission to edit this patient\'s information',
        }
      }
    }

    // 3. Validate input with schema
    let validatedData: DemographicsFormInput
    try {
      validatedData = demographicsSchema.parse(input)
    } catch (validationError: any) {
      const fieldErrors = validationError.flatten?.().fieldErrors || {}
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
        .join('; ')
      
      return {
        success: false,
        error: `Validation failed: ${errorMessages}`,
      }
    }

    // 4. Get current user data to track changes
    const currentUserData = await prisma.user.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        middleName: true,
        suffix: true,
        nickname: true,
        dob: true,
        gender: true,
        bloodType: true,
        civilStatus: true,
        mobile: true,
        telephone: true,
        placeOfBirth: true,
        nationality: true,
        religion: true,
      },
    })

    if (!currentUserData) {
      return {
        success: false,
        error: 'User profile not found',
      }
    }

    // 5. Check field-level permissions
    const allowedFields = Object.keys(validatedData).filter((field) =>
      userCanEditField(authUser.id, userId, UserRole.PATIENT, field)
    )

    const invalidFields = Object.keys(validatedData).filter(
      (field) => !allowedFields.includes(field)
    )

    if (invalidFields.length > 0) {
      return {
        success: false,
        error: `You do not have permission to edit: ${invalidFields.join(', ')}`,
      }
    }

    // 6. Update database with validated data
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        firstName: validatedData.firstName !== undefined ? validatedData.firstName : undefined,
        lastName: validatedData.lastName !== undefined ? validatedData.lastName : undefined,
        middleName: validatedData.middleName !== undefined ? validatedData.middleName : undefined,
        suffix: validatedData.suffix !== undefined ? validatedData.suffix : undefined,
        nickname: validatedData.nickname !== undefined ? validatedData.nickname : undefined,
        dob: validatedData.dob !== undefined ? validatedData.dob : undefined,
        gender: validatedData.gender !== undefined ? validatedData.gender : undefined,
        bloodType: validatedData.bloodType !== undefined ? validatedData.bloodType : undefined,
        civilStatus: validatedData.civilStatus !== undefined ? validatedData.civilStatus : undefined,
        mobile: validatedData.mobile !== undefined ? validatedData.mobile : undefined,
        telephone: validatedData.telephone !== undefined ? validatedData.telephone : undefined,
        placeOfBirth: validatedData.placeOfBirth !== undefined ? validatedData.placeOfBirth : undefined,
        nationality: validatedData.nationality !== undefined ? validatedData.nationality : undefined,
        religion: validatedData.religion !== undefined ? validatedData.religion : undefined,
      } as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    // 7. Log the change for audit trail
    const changes = trackChanges(currentUserData, validatedData)
    await logAudit({
      entityType: AuditEntityType.USER,
      entityId: updatedUser.id,
      action: AuditAction.UPDATE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: {
        source: 'updateDemographics',
      },
    })

    return {
      success: true,
      message: `Profile updated successfully for ${updatedUser.firstName} ${updatedUser.lastName}`,
    }
  } catch (error) {
    console.error('[UPDATE_DEMOGRAPHICS_ERROR]', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating profile. Please try again.',
    }
  }
}
