'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { philHealthRecordSchema, type PhilHealthRecordFormInput } from '@/schemas'
import { logAudit, AuditAction, AuditEntityType, trackChanges } from '@/lib/audit-logger'

export interface UpdatePhilhealthRecordResponse {
  success: boolean
  error?: string
  message?: string
}

/**
 * Check if user has explicit permission to update health records
 * STRICT: Owner must still have permission - no self-editing bypass
 * @param authUserId - Clerk user ID attempting the action
 * @param targetUserId - Clerk user ID of the record being edited
 * @returns true only if user has explicit database permission
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

    // STRICT: Check explicit database permission - no bypass even for self-editing
    const permissionCheck = await userHasPhilHealthPermission(authUser.id, userId)
    
    if (!permissionCheck.allowed) {
      // Provide helpful error message with required permissions
      const permList = permissionCheck.requiredPermissions.join(', ')
      if (isOwn) {
        return { 
          success: false, 
          error: `Permission denied. To edit your PhilHealth information, you need one of these permissions: ${permList}. Contact your administrator to request access.` 
        }
      } else {
        return { 
          success: false, 
          error: `Permission denied. To edit another user's PhilHealth information, you need one of these permissions: ${permList}. Only authorized healthcare providers can edit other users' health records.` 
        }
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

    // Get target user's database ID
    const targetUser = await prisma.user.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!targetUser) {
      return { success: false, error: 'Target user not found' }
    }

    const currentRecord = await prisma.philHealthRecord.findFirst({
      where: { userId: targetUser.id },
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
          userId: targetUser.id,
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
