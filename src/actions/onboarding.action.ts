"use server";

import prisma from "@lib/prisma";
import { $Enums } from "@prisma/client";
import { sessionCheck } from "@/lib/auth";
import { withErrorHandling } from "@/lib/with-error-handling";
import { requirePermissionOrOwnership, isOwnResource, requireUserPermission } from "@/lib/permission-checker";
import { PermissionError } from "@/lib/permission-errors";
import { PERMISSIONS } from "@/lib/permissions";

type PrismaTransactionalClient = Parameters<
  Parameters<typeof prisma["$transaction"]>[0]
>[0];

// ─── Types ───────────────────────────────────────────────────────────────────

export type UpdateOnboardingStatusPayload = {
  userId: string;
  onboardingStatus: $Enums.OnboardingStatus;
  profileCompletionStatus?: $Enums.ProfileCompletionStatus;
};

export type RecordFirstLoginPayload = {
  userId: string;
};

export type CompleteOnboardingStepPayload = {
  userId: string;
  stepName: string;
  entityType?: $Enums.OnboardingEntityType;
  entityId?: number;
};

export type CreateOnboardingStepsPayload = {
  userId: string;
  entityType?: $Enums.OnboardingEntityType;
  entityId?: number;
  steps: {
    stepName: string;
    stepLabel?: string;
    isRequired?: boolean;
  }[];
};

export type ClaimShellAccountPayload = {
  shellUserId: string;
  claimingUserId: string;
};

export type GetOnboardingStatusPayload = {
  userId: string;
};

export type CreateOrgOnboardingRequirementPayload = {
  organizationId: number;
  entityType?: $Enums.OnboardingEntityType;
  fieldName: string;
  fieldLabel?: string;
  isRequired?: boolean;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Update onboarding status for a user
 * Requires UPDATE:USER:ONBOARDING_STATUS permission or user accessing their own record
 */
export const updateOnboardingStatusAction = withErrorHandling(
  async (payload: UpdateOnboardingStatusPayload) => {
    const session = await sessionCheck();
    
    // Check permission: allow if user is updating their own status
    const isOwn = await isOwnResource(payload.userId);
    
    if (!isOwn) {
      // For updating other users, need explicit USER-level permission
      await requireUserPermission(
        session.user.sub,
        PERMISSIONS.USER["UPDATE:USER:ONBOARDING_STATUS"].name,
        "update other users' onboarding status"
      );
    }

    const result = await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { userId: payload.userId },
      });

      const updateData: {
        onboardingStatus: $Enums.OnboardingStatus;
        profileCompletionStatus?: $Enums.ProfileCompletionStatus;
        onboardingCompletedAt?: Date;
      } = {
        onboardingStatus: payload.onboardingStatus,
      };

      if (payload.profileCompletionStatus) {
        updateData.profileCompletionStatus = payload.profileCompletionStatus;
      }

      if (payload.onboardingStatus === "COMPLETED") {
        updateData.onboardingCompletedAt = new Date();
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Audit log
      await tx.onboardingStepLog.create({
        data: {
          userId: user.id,
          entityType: "USER",
          action: "STATUS_CHANGE",
          previousStatus: user.onboardingStatus,
          newStatus: payload.onboardingStatus,
        },
      });

      return updatedUser;
    });

    return {
      message: "Onboarding status updated successfully",
      data: result,
    };
  }
);

/**
 * Record the first login timestamp for a user
 */
export const recordFirstLoginAction = withErrorHandling(
  async (payload: RecordFirstLoginPayload) => {
    const result = await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { userId: payload.userId },
      });

      // Only set firstLogin if it hasn't been set yet
      if (user.firstLogin) {
        return user;
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { firstLogin: new Date() },
      });

      // Audit log
      await tx.onboardingStepLog.create({
        data: {
          userId: user.id,
          entityType: "USER",
          action: "FIRST_LOGIN",
        },
      });

      return updatedUser;
    });

    return {
      message: "First login recorded",
      data: result,
    };
  }
);

/**
 * Create onboarding steps for a user
 */
export const createOnboardingStepsAction = withErrorHandling(
  async (payload: CreateOnboardingStepsPayload) => {
    await sessionCheck();

    const result = await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { userId: payload.userId },
      });

      const steps = await Promise.all(
        payload.steps.map(async (step) => {
          const existing = await tx.onboardingStep.findFirst({
            where: {
              userId: user.id,
              entityType: payload.entityType ?? "USER",
              entityId: payload.entityId ?? null,
              stepName: step.stepName,
            },
          });

          if (existing) {
            return tx.onboardingStep.update({
              where: { id: existing.id },
              data: {
                stepLabel: step.stepLabel,
                isRequired: step.isRequired ?? true,
              },
            });
          }

          return tx.onboardingStep.create({
            data: {
              userId: user.id,
              entityType: payload.entityType ?? "USER",
              entityId: payload.entityId,
              stepName: step.stepName,
              stepLabel: step.stepLabel,
              isRequired: step.isRequired ?? true,
            },
          });
        })
      );

      return steps;
    });

    return {
      message: "Onboarding steps created successfully",
      data: result,
    };
  }
);

/**
 * Complete a specific onboarding step
 * Requires COMPLETE:USER:ONBOARDING_STEP permission or user completing their own step
 */
export const completeOnboardingStepAction = withErrorHandling(
  async (payload: CompleteOnboardingStepPayload) => {
    const session = await sessionCheck();
    
    // Check permission: allow if user is completing their own step
    const isOwn = await isOwnResource(payload.userId);
    
    if (!isOwn) {
      // For completing steps for other users, need explicit USER-level permission
      await requireUserPermission(
        session.user.sub,
        PERMISSIONS.USER["COMPLETE:USER:ONBOARDING_STEP"].name,
        "complete onboarding steps for other users"
      );
    }

    const result = await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { userId: payload.userId },
      });

      const step = await tx.onboardingStep.findFirst({
        where: {
          userId: user.id,
          stepName: payload.stepName,
          entityType: payload.entityType ?? "USER",
          entityId: payload.entityId ?? null,
        },
      });

      if (!step) {
        throw new Error(`Onboarding step '${payload.stepName}' not found for user '${payload.userId}' (entityType: ${payload.entityType ?? "USER"})`);
      }

      const updatedStep = await tx.onboardingStep.update({
        where: { id: step.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Audit log
      await tx.onboardingStepLog.create({
        data: {
          userId: user.id,
          entityType: payload.entityType ?? "USER",
          entityId: payload.entityId,
          action: "STEP_COMPLETED",
          stepName: payload.stepName,
          previousStatus: step.status,
          newStatus: "COMPLETED",
        },
      });

      return updatedStep;
    });

    return {
      message: "Onboarding step completed",
      data: result,
    };
  }
);

/**
 * Claim a shell account (transition from provider-created to end-user owned)
 * Requires CLAIM:USER:SHELL_ACCOUNT permission
 */
export const claimShellAccountAction = withErrorHandling(
  async (payload: ClaimShellAccountPayload) => {
    const session = await sessionCheck();
    
    // Verify the claiming user is the authenticated user
    if (session.user.sub !== payload.claimingUserId) {
      throw new PermissionError(
        "You can only claim accounts for yourself",
        PERMISSIONS.USER["CLAIM:USER:SHELL_ACCOUNT"].name,
        "USER"
      );
    }

    const result = await prisma.$transaction(async (tx: PrismaTransactionalClient) => {
      const shellUser = await tx.user.findUniqueOrThrow({
        where: { userId: payload.shellUserId },
      });

      if (shellUser.accountType !== "SHELL") {
        throw new Error(`Account is not a shell account (current type: ${shellUser.accountType})`);
      }

      if (shellUser.claimedAt) {
        throw new Error(`Account has already been claimed on ${shellUser.claimedAt.toISOString()} by user ID ${shellUser.claimedBy}`);
      }

      const claimingUser = await tx.user.findUniqueOrThrow({
        where: { userId: payload.claimingUserId },
      });

      const updatedUser = await tx.user.update({
        where: { id: shellUser.id },
        data: {
          accountType: "FULL",
          claimedAt: new Date(),
          claimedBy: claimingUser.id,
          onboardingStatus: "IN_PROGRESS",
        },
      });

      // Audit log
      await tx.onboardingStepLog.create({
        data: {
          userId: shellUser.id,
          entityType: "USER",
          action: "ACCOUNT_CLAIMED",
          previousStatus: "SHELL",
          newStatus: "FULL",
          performedBy: claimingUser.id,
        },
      });

      return updatedUser;
    });

    return {
      message: "Shell account claimed successfully",
      data: result,
    };
  }
);

/**
 * Get onboarding status and steps for a user
 * Requires VIEW:USER:ONBOARDING_STATUS permission or user viewing their own status
 */
export const getOnboardingStatusAction = withErrorHandling(
  async (payload: GetOnboardingStatusPayload) => {
    const session = await sessionCheck();
    
    // Check permission: allow if user is viewing their own status
    const isOwn = await isOwnResource(payload.userId);
    
    if (!isOwn) {
      // For viewing other users' status, need explicit USER-level permission
      await requireUserPermission(
        session.user.sub,
        PERMISSIONS.USER["VIEW:USER:ONBOARDING_STATUS"].name,
        "view other users' onboarding status"
      );
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { userId: payload.userId },
      select: {
        id: true,
        userId: true,
        onboardingStatus: true,
        profileCompletionStatus: true,
        accountType: true,
        firstLogin: true,
        onboardingCompletedAt: true,
        claimedAt: true,
        claimedBy: true,
        OnboardingSteps: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return {
      message: "Onboarding status retrieved",
      data: user,
    };
  }
);

/**
 * Create an organization-level onboarding requirement
 */
export const createOrgOnboardingRequirementAction = withErrorHandling(
  async (payload: CreateOrgOnboardingRequirementPayload) => {
    await sessionCheck();

    const result = await prisma.orgOnboardingRequirement.upsert({
      where: {
        unique_org_onboarding_requirement: {
          organizationId: payload.organizationId,
          entityType: payload.entityType ?? "USER",
          fieldName: payload.fieldName,
        },
      },
      update: {
        fieldLabel: payload.fieldLabel,
        isRequired: payload.isRequired ?? true,
        isActive: true,
      },
      create: {
        organizationId: payload.organizationId,
        entityType: payload.entityType ?? "USER",
        fieldName: payload.fieldName,
        fieldLabel: payload.fieldLabel,
        isRequired: payload.isRequired ?? true,
      },
    });

    return {
      message: "Organization onboarding requirement created",
      data: result,
    };
  }
);

/**
 * Get organization-level onboarding requirements
 */
export const getOrgOnboardingRequirementsAction = withErrorHandling(
  async ({
    organizationId,
    entityType,
  }: {
    organizationId: number;
    entityType?: $Enums.OnboardingEntityType;
  }) => {
    await sessionCheck();

    const requirements = await prisma.orgOnboardingRequirement.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      message: "Organization onboarding requirements retrieved",
      data: requirements,
    };
  }
);
