'use server'

/**
 * Update User Demographics
 * Server action for updating patient profile information
 * User-centric: Validates all fields, checks permissions, logs changes
 */

import { currentUser, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { demographicsSchema, type DemographicsFormInput } from '@/schemas'
import {
  userCanEditField,
  getUserPermissionLevel,
} from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'
import { logAudit, AuditAction, AuditEntityType, trackChanges } from '@/lib/audit-logger'
import { normalizeDobToUtcNoon } from '@/lib/utils'

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
    // Derive the correct role: self-edits use PATIENT, third-party edits use HEALTHCARE_PROVIDER
    const editorRole = isOwn ? UserRole.PATIENT : UserRole.HEALTHCARE_PROVIDER
    const allowedFields = Object.keys(validatedData).filter((field) =>
      userCanEditField(authUser.id, userId, editorRole, field)
    )

    if (isOwn) {
      // Patient editing own record: strict — reject if any submitted field is not allowed
      const invalidFields = Object.keys(validatedData).filter(
        (field) => !allowedFields.includes(field)
      )
      if (invalidFields.length > 0) {
        return {
          success: false,
          error: `You do not have permission to edit: ${invalidFields.join(', ')}`,
        }
      }
    }
    // Healthcare provider: silently drop fields they cannot edit (e.g. mobile, telephone, religion)
    // rather than rejecting the entire save.
    const dataToUpdate = Object.fromEntries(
      Object.entries(validatedData).filter(([field]) => allowedFields.includes(field))
    ) as Partial<DemographicsFormInput>

    // 6. Update database with validated data
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        firstName: dataToUpdate.firstName !== undefined ? dataToUpdate.firstName : undefined,
        lastName: dataToUpdate.lastName !== undefined ? dataToUpdate.lastName : undefined,
        middleName: dataToUpdate.middleName !== undefined ? dataToUpdate.middleName : undefined,
        suffix: dataToUpdate.suffix !== undefined ? dataToUpdate.suffix : undefined,
        nickname: dataToUpdate.nickname !== undefined ? dataToUpdate.nickname : undefined,
        dob: dataToUpdate.dob !== undefined ? (dataToUpdate.dob ? normalizeDobToUtcNoon(dataToUpdate.dob) : null) : undefined,
        gender: dataToUpdate.gender !== undefined ? dataToUpdate.gender : undefined,
        bloodType: dataToUpdate.bloodType !== undefined ? dataToUpdate.bloodType : undefined,
        civilStatus: dataToUpdate.civilStatus !== undefined ? dataToUpdate.civilStatus : undefined,
        mobile: dataToUpdate.mobile !== undefined ? dataToUpdate.mobile : undefined,
        telephone: dataToUpdate.telephone !== undefined ? dataToUpdate.telephone : undefined,
        placeOfBirth: dataToUpdate.placeOfBirth !== undefined ? dataToUpdate.placeOfBirth : undefined,
        nationality: dataToUpdate.nationality !== undefined ? dataToUpdate.nationality : undefined,
        religion: dataToUpdate.religion !== undefined ? dataToUpdate.religion : undefined,
      } as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    // 7. Sync name changes to Clerk if applicable
    try {
      const clerkUpdateData: Partial<{ firstName: string; lastName: string }> = {}

      if (dataToUpdate.firstName !== undefined && dataToUpdate.firstName !== currentUserData.firstName) {
        clerkUpdateData.firstName = dataToUpdate.firstName
      }

      if (dataToUpdate.lastName !== undefined && dataToUpdate.lastName !== currentUserData.lastName) {
        clerkUpdateData.lastName = dataToUpdate.lastName
      }

      // Only update Clerk if there are name changes
      if (Object.keys(clerkUpdateData).length > 0) {
        const client = await clerkClient()
        // Use `userId` (the patient's Clerk ID), not `authUser.id` (the editing HP's ID)
        await client.users.updateUser(userId, clerkUpdateData)
        console.log(`[CLERK_SYNC] Updated user ${userId} with demographics changes`)
      }
    } catch (clerkError) {
      console.error('[CLERK_SYNC_ERROR] Failed to sync demographics to Clerk:', clerkError)
      // Don't fail the entire update if Clerk sync fails - database update succeeded
    }

    // 8. Log the change for audit trail
    const changes = trackChanges(currentUserData, dataToUpdate)
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
