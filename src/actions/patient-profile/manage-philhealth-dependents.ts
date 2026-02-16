'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { philHealthDependentSchema, type PhilHealthDependentFormInput } from '@/schemas'
import { logAudit, AuditAction, AuditEntityType } from '@/lib/audit-logger'

export interface ManageDependentResponse {
  success: boolean
  error?: string
  message?: string
  dependent?: any
}

/**
 * Check if user has explicit permission to manage PhilHealth dependents
 * STRICT: Owner must still have permission - no self-editing bypass
 * @param authUserId - Clerk user ID attempting the action
 * @param targetUserId - Clerk user ID of the record being edited
 * @returns Permission check result with allowed status and required permissions
 */
async function userHasPhilHealthPermission(authUserId: string, targetUserId: string): Promise<{ allowed: boolean, requiredPermissions: string[] }> {
  // Get auth user's database ID
  const authUser = await prisma.user.findUnique({
    where: { userId: authUserId },
    select: { id: true }
  })
  
  if (!authUser) {
    return { allowed: false, requiredPermissions: ['User profile not found in system'] }
  }

  const isOwnRecord = authUserId === targetUserId

  // Define required permissions based on context
  const requiredPermissions = isOwnRecord
    ? ['update:user:profile:own', 'update:patient:health-record:own', 'super_admin']
    : ['update:clinic:patient:all', 'update:patient:health-record:any', 'super_admin']

  // Check if user has ANY of the required permissions
  const hasPermission = await prisma.userPermission.findFirst({
    where: {
      userId: authUser.id,
      Permission: {
        isActive: true,
        deletedAt: null,
        name: {
          in: requiredPermissions
        }
      }
    },
    include: {
      Permission: {
        select: { name: true }
      }
    }
  })

  return {
    allowed: !!hasPermission,
    requiredPermissions
  }
}

/**
 * Add a dependent to PhilHealth record
 */
export async function addPhilHealthDependent(
  userId: string,
  philHealthRecordId: number,
  input: PhilHealthDependentFormInput
): Promise<ManageDependentResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    
    // STRICT: Check explicit database permission - no bypass even for self-editing
    const permissionCheck = await userHasPhilHealthPermission(authUser.id, userId)
    
    if (!permissionCheck.allowed) {
      // Provide helpful error message with required permissions
      const permList = permissionCheck.requiredPermissions.join(', ')
      if (isOwn) {
        return { 
          success: false, 
          error: `Permission denied. To manage your PhilHealth dependents, you need one of these permissions: ${permList}. Contact your administrator to request access.` 
        }
      } else {
        return { 
          success: false, 
          error: `Permission denied. To manage another user's PhilHealth dependents, you need one of these permissions: ${permList}. Only authorized healthcare providers can edit other users' health records.` 
        }
      }
    }

    // Validate input
    let validatedInput: PhilHealthDependentFormInput
    try {
      validatedInput = philHealthDependentSchema.parse(input)
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
    const targetUser = await prisma.user.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!targetUser) {
      return { success: false, error: 'Target user not found' }
    }

    // Verify PhilHealth record exists
    const record = await prisma.philHealthRecord.findUnique({
      where: { id: philHealthRecordId },
      select: { userId: true }
    })

    if (!record || record.userId !== targetUser.id) {
      return { success: false, error: 'PhilHealth record not found' }
    }

    // Create dependent
    const dependent = await prisma.philHealthDependent.create({
      data: {
        philHealthRecordId,
        firstName: validatedInput.firstName,
        middleName: validatedInput.middleName || null,
        lastName: validatedInput.lastName || null,
        suffix: validatedInput.suffix || null,
        relationship: validatedInput.relationship || null,
        dob: validatedInput.dob || null,
        gender: (validatedInput.gender as 'MALE' | 'FEMALE' | null) || null,
        citizenship: validatedInput.citizenship || null,
        isPermanentlyDisabled: validatedInput.isPermanentlyDisabled || false,
      }
    })

    await logAudit({
      entityType: AuditEntityType.PHILHEALTH_RECORD,
      entityId: userId,
      action: AuditAction.CREATE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      metadata: {
        subentity: 'PhilHealthDependent',
        dependentName: `${validatedInput.firstName} ${validatedInput.lastName || ''}`,
        relationship: validatedInput.relationship || 'Unknown'
      },
    })

    return {
      success: true,
      message: 'Dependent added successfully',
      dependent
    }
  } catch (error) {
    console.error('[ADD_PHILHEALTH_DEPENDENT_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Update a dependent on PhilHealth record
 */
export async function updatePhilHealthDependent(
  userId: string,
  dependentId: number,
  input: PhilHealthDependentFormInput
): Promise<ManageDependentResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    
    // STRICT: Check explicit database permission - no bypass even for self-editing
    const permissionCheck = await userHasPhilHealthPermission(authUser.id, userId)
    
    if (!permissionCheck.allowed) {
      // Provide helpful error message with required permissions
      const permList = permissionCheck.requiredPermissions.join(', ')
      if (isOwn) {
        return { 
          success: false, 
          error: `Permission denied. To manage your PhilHealth dependents, you need one of these permissions: ${permList}. Contact your administrator to request access.` 
        }
      } else {
        return { 
          success: false, 
          error: `Permission denied. To manage another user's PhilHealth dependents, you need one of these permissions: ${permList}. Only authorized healthcare providers can edit other users' health records.` 
        }
      }
    }

    // Validate input
    let validatedInput: PhilHealthDependentFormInput
    try {
      validatedInput = philHealthDependentSchema.parse(input)
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
    const targetUser = await prisma.user.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!targetUser) {
      return { success: false, error: 'Target user not found' }
    }

    // Verify dependent belongs to user
    const dependent = await prisma.philHealthDependent.findUnique({
      where: { id: dependentId },
      include: { PhilHealthRecord: { select: { userId: true } } }
    })

    if (!dependent || dependent.PhilHealthRecord.userId !== targetUser.id) {
      return { success: false, error: 'Dependent not found' }
    }

    // Update dependent
    const updated = await prisma.philHealthDependent.update({
      where: { id: dependentId },
      data: {
        firstName: validatedInput.firstName,
        middleName: validatedInput.middleName || null,
        lastName: validatedInput.lastName || null,
        suffix: validatedInput.suffix || null,
        relationship: validatedInput.relationship || null,
        dob: validatedInput.dob || null,
        gender: (validatedInput.gender as 'MALE' | 'FEMALE' | null) || null,
        citizenship: validatedInput.citizenship || null,
        isPermanentlyDisabled: validatedInput.isPermanentlyDisabled || false,
      }
    })

    await logAudit({
      entityType: AuditEntityType.PHILHEALTH_RECORD,
      entityId: userId,
      action: AuditAction.UPDATE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      metadata: {
        subentity: 'PhilHealthDependent',
        dependentName: `${validatedInput.firstName} ${validatedInput.lastName || ''}`,
      },
    })

    return {
      success: true,
      message: 'Dependent updated successfully',
      dependent: updated
    }
  } catch (error) {
    console.error('[UPDATE_PHILHEALTH_DEPENDENT_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Remove a dependent from PhilHealth record
 */
export async function removePhilHealthDependent(
  userId: string,
  dependentId: number
): Promise<ManageDependentResponse> {
  try {
    const authUser = await currentUser()
    if (!authUser?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const isOwn = authUser.id === userId
    
    // STRICT: Check explicit database permission - no bypass even for self-editing
    const permissionCheck = await userHasPhilHealthPermission(authUser.id, userId)
    
    if (!permissionCheck.allowed) {
      // Provide helpful error message with required permissions
      const permList = permissionCheck.requiredPermissions.join(', ')
      if (isOwn) {
        return { 
          success: false, 
          error: `Permission denied. To manage your PhilHealth dependents, you need one of these permissions: ${permList}. Contact your administrator to request access.` 
        }
      } else {
        return { 
          success: false, 
          error: `Permission denied. To manage another user's PhilHealth dependents, you need one of these permissions: ${permList}. Only authorized healthcare providers can edit other users' health records.` 
        }
      }
    }

    // Get target user's database ID
    const targetUser = await prisma.user.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!targetUser) {
      return { success: false, error: 'Target user not found' }
    }

    // Verify dependent belongs to user
    const dependent = await prisma.philHealthDependent.findUnique({
      where: { id: dependentId },
      include: { PhilHealthRecord: { select: { userId: true } } }
    })

    if (!dependent || dependent.PhilHealthRecord.userId !== targetUser.id) {
      return { success: false, error: 'Dependent not found' }
    }

    const dependentName = `${dependent.firstName} ${dependent.lastName || ''}`

    // Delete dependent
    await prisma.philHealthDependent.delete({
      where: { id: dependentId }
    })

    await logAudit({
      entityType: AuditEntityType.PHILHEALTH_RECORD,
      entityId: userId,
      action: AuditAction.DELETE,
      performedBy: authUser.id,
      targetUser: !isOwn ? userId : undefined,
      metadata: {
        subentity: 'PhilHealthDependent',
        dependentName,
      },
    })

    return {
      success: true,
      message: `Dependent "${dependentName}" removed successfully`
    }
  } catch (error) {
    console.error('[REMOVE_PHILHEALTH_DEPENDENT_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
