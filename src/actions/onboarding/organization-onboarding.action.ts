'use server';

import { db } from '@/lib/db';
import { OnboardingStatus, AuditActionType, EntityType } from '@prisma/client';
import { createAuditLog } from '../audit.action';

export interface OrganizationOnboardingData {
  userId: number;
  organizationId: number;
  acceptedAgreements?: string[];
  completedRequirements?: Record<string, boolean>;
}

/**
 * Validate organization member onboarding
 */
export async function validateOrganizationOnboarding(params: {
  userId: number;
  organizationId: number;
}) {
  const { userId, organizationId } = params;

  try {
    const member = await db.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
      include: {
        OrganizationRole: {
          select: {
            name: true,
            requirements: true,
          },
        },
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            dob: true,
            gender: true,
            mobile: true,
            onboardingStatus: true,
          },
        },
      },
    });

    if (!member) {
      return { success: false, error: 'Organization member not found' };
    }

    // Check if user profile is complete
    const userRequiredFields = {
      firstName: member.User.firstName,
      lastName: member.User.lastName,
      email: member.User.email,
      dob: member.User.dob,
      gender: member.User.gender,
      mobile: member.User.mobile,
    };

    const missingUserFields = Object.entries(userRequiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    // Check org-specific requirements
    const roleRequirements = member.OrganizationRole.requirements || [];
    const missingOrgRequirements = roleRequirements.filter((req) => {
      // TODO: Implement actual requirement checking logic
      return false;
    });

    const isComplete =
      missingUserFields.length === 0 &&
      missingOrgRequirements.length === 0 &&
      member.status === 'ACTIVE';

    return {
      success: true,
      data: {
        isComplete,
        missingUserFields,
        missingOrgRequirements,
        roleRequirements,
        onboardingStatus: member.onboardingStatus,
        memberStatus: member.status,
      },
    };
  } catch (error) {
    console.error('Failed to validate organization onboarding:', error);
    return { success: false, error: 'Failed to validate organization onboarding' };
  }
}

/**
 * Complete organization member onboarding
 */
export async function completeOrganizationOnboarding(
  params: OrganizationOnboardingData
) {
  const { userId, organizationId, acceptedAgreements, completedRequirements } = params;

  try {
    // Find the organization member
    const member = await db.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!member) {
      return { success: false, error: 'Organization member not found' };
    }

    // Update member onboarding status
    const updatedMember = await db.organizationMember.update({
      where: { id: member.id },
      data: {
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingCompletionDate: new Date(),
        status: 'ACTIVE', // Activate the member
      },
    });

    // Grant role-based permissions if not already granted
    const rolePermissions = await db.orgRoleInitialPermission.findMany({
      where: { orgRoleId: member.role },
    });

    // Check existing permissions
    const existingPermissions = await db.orgMemberPermission.findMany({
      where: { orgMemberId: member.id },
    });

    const existingPermissionIds = new Set(
      existingPermissions.map((p) => p.permissionId)
    );

    const permissionsToAdd = rolePermissions.filter(
      (rp) => !existingPermissionIds.has(rp.permissionId)
    );

    if (permissionsToAdd.length > 0) {
      await db.orgMemberPermission.createMany({
        data: permissionsToAdd.map((rp) => ({
          orgMemberId: member.id,
          permissionId: rp.permissionId,
        })),
      });

      // Log permission grants
      for (const perm of permissionsToAdd) {
        await createAuditLog({
          actorId: userId,
          actionType: AuditActionType.PERMISSION_GRANT,
          entityType: EntityType.ORGANIZATION_MEMBER,
          entityId: member.id,
          targetUserId: userId,
          metadata: {
            permissionId: perm.permissionId,
            grantedVia: 'onboarding',
          },
        });
      }
    }

    // Create audit log for onboarding completion
    await createAuditLog({
      actorId: userId,
      actionType: AuditActionType.ONBOARDING_COMPLETE,
      entityType: EntityType.ORGANIZATION_MEMBER,
      entityId: member.id,
      targetUserId: userId,
      metadata: {
        organizationId,
        completedAt: new Date().toISOString(),
        acceptedAgreements,
        completedRequirements,
      },
    });

    return { success: true, data: updatedMember };
  } catch (error) {
    console.error('Failed to complete organization onboarding:', error);
    return {
      success: false,
      error: 'Failed to complete organization onboarding',
    };
  }
}

/**
 * Get organization-specific onboarding requirements
 */
export async function getOrganizationOnboardingRequirements(params: {
  userId: number;
  organizationId: number;
}) {
  const { userId, organizationId } = params;

  try {
    const member = await db.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
      include: {
        OrganizationRole: {
          select: {
            name: true,
            description: true,
            requirements: true,
          },
        },
        Organization: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    if (!member) {
      return { success: false, error: 'Organization member not found' };
    }

    const requirements = {
      role: member.OrganizationRole.name,
      roleDescription: member.OrganizationRole.description,
      roleRequirements: member.OrganizationRole.requirements,
      organization: {
        name: member.Organization.name,
        description: member.Organization.description,
      },
      currentStatus: member.onboardingStatus,
    };

    return { success: true, data: requirements };
  } catch (error) {
    console.error('Failed to fetch onboarding requirements:', error);
    return { success: false, error: 'Failed to fetch onboarding requirements' };
  }
}

/**
 * Update organization member onboarding progress
 */
export async function updateOrganizationOnboardingProgress(params: {
  userId: number;
  organizationId: number;
  status: OnboardingStatus;
  metadata?: Record<string, unknown>;
}) {
  const { userId, organizationId, status, metadata } = params;

  try {
    const member = await db.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!member) {
      return { success: false, error: 'Organization member not found' };
    }

    const updatedMember = await db.organizationMember.update({
      where: { id: member.id },
      data: {
        onboardingStatus: status,
      },
    });

    // Create audit log
    await createAuditLog({
      actorId: userId,
      actionType: AuditActionType.UPDATE,
      entityType: EntityType.ORGANIZATION_MEMBER,
      entityId: member.id,
      targetUserId: userId,
      fieldName: 'onboardingStatus',
      oldValue: member.onboardingStatus,
      newValue: status,
      metadata,
    });

    return { success: true, data: updatedMember };
  } catch (error) {
    console.error('Failed to update onboarding progress:', error);
    return { success: false, error: 'Failed to update onboarding progress' };
  }
}
