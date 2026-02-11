'use server';

import prisma from '@/lib/prisma';
import { OnboardingStatus, AuditActionType, EntityType, BloodType, Prisma } from '@prisma/client';
import { createAuditLog } from '../audit.action';

export interface OnboardingStepInput {
  userId: number;
  stepType: string;
  stepName: string;
  status?: OnboardingStatus;
  metadata?: Prisma.InputJsonValue;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  dob: Date;
  gender: 'MALE' | 'FEMALE';
  mobile: string;
  middleName?: string;
  suffix?: string;
  nickname?: string;
  placeOfBirth?: string;
  civilStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
  bloodType?: BloodType | null;
  telephone?: string;
  religion?: string;
  nationality?: string;
  picture?: string;
}

/**
 * Check if user profile meets onboarding requirements
 */
export async function validateUserOnboarding(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true,
        mobile: true,
        onboardingStatus: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const requiredFields = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dob: user.dob,
      gender: user.gender,
      mobile: user.mobile,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    const isComplete = missingFields.length === 0;

    return {
      success: true,
      data: {
        isComplete,
        missingFields,
        currentStatus: user.onboardingStatus,
      },
    };
  } catch (error) {
    console.error('Failed to validate user onboarding:', error);
    return { success: false, error: 'Failed to validate user onboarding' };
  }
}

/**
 * Complete user onboarding
 */
export async function completeUserOnboarding(params: {
  userId: number;
  profileData: UserProfileData;
  actorId?: number;
}) {
  const { userId, profileData, actorId } = params;

  try {
    // Validate required fields
    const requiredFields: (keyof UserProfileData)[] = [
      'firstName',
      'lastName',
      'email',
      'dob',
      'gender',
      'mobile',
    ];
    const missing = requiredFields.filter((field) => !profileData[field]);

    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      };
    }

    // Get current user data for audit trail
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        dob: profileData.dob,
        gender: profileData.gender,
        mobile: profileData.mobile,
        middleName: profileData.middleName,
        suffix: profileData.suffix,
        nickname: profileData.nickname,
        placeOfBirth: profileData.placeOfBirth,
        civilStatus: profileData.civilStatus,
        bloodType: profileData.bloodType,
        telephone: profileData.telephone,
        religion: profileData.religion,
        nationality: profileData.nationality,
        picture: profileData.picture,
        onboardingStatus: OnboardingStatus.COMPLETED,
        profileCompletionDate: new Date(),
        isShellAccount: false,
      },
    });

    // Log field changes
    const changes: Array<{ fieldName: string; oldValue: string; newValue: string }> = [];
    
    (Object.keys(profileData) as Array<keyof UserProfileData>).forEach((key) => {
      const oldValue = currentUser[key as keyof typeof currentUser];
      const newValue = profileData[key];
      if (oldValue !== newValue && newValue !== undefined) {
        changes.push({
          fieldName: key,
          oldValue: String(oldValue ?? ''),
          newValue: String(newValue),
        });
      }
    });

    // Add onboarding status change
    changes.push({
      fieldName: 'onboardingStatus',
      oldValue: currentUser.onboardingStatus,
      newValue: OnboardingStatus.COMPLETED,
    });

    // Create audit log for onboarding completion
    await createAuditLog({
      actorId: actorId || userId,
      actionType: AuditActionType.ONBOARDING_COMPLETE,
      entityType: EntityType.USER,
      entityId: userId,
      targetUserId: userId,
      metadata: {
        completedAt: new Date().toISOString(),
        changes,
      },
    });

    // Mark all onboarding steps as completed
    await prisma.onboardingStep.updateMany({
      where: {
        userId,
        status: { not: OnboardingStatus.COMPLETED },
      },
      data: {
        status: OnboardingStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Failed to complete user onboarding:', error);
    return { success: false, error: 'Failed to complete user onboarding' };
  }
}

/**
 * Create or update onboarding step
 */
export async function upsertOnboardingStep(params: OnboardingStepInput) {
  const { userId, stepType, stepName, status = OnboardingStatus.PENDING, metadata } = params;

  try {
    const existingStep = await prisma.onboardingStep.findFirst({
      where: { userId, stepType, stepName },
    });

    let step;
    if (existingStep) {
      const baseUpdate = {
        status,
        startedAt: status === OnboardingStatus.IN_PROGRESS && !existingStep.startedAt
          ? new Date()
          : existingStep.startedAt,
        completedAt: status === OnboardingStatus.COMPLETED ? new Date() : existingStep.completedAt,
      };
      
      // Handle optional metadata explicitly for type safety
      if (metadata !== undefined) {
        step = await prisma.onboardingStep.update({
          where: { id: existingStep.id },
          data: { ...baseUpdate, metadata },
        });
      } else {
        step = await prisma.onboardingStep.update({
          where: { id: existingStep.id },
          data: baseUpdate,
        });
      }
    } else {
      const baseCreate = {
        userId,
        stepType,
        stepName,
        status,
        startedAt: status === OnboardingStatus.IN_PROGRESS ? new Date() : null,
        completedAt: status === OnboardingStatus.COMPLETED ? new Date() : null,
      };
      
      // Handle optional metadata explicitly for type safety
      if (metadata !== undefined) {
        step = await prisma.onboardingStep.create({
          data: { ...baseCreate, metadata },
        });
      } else {
        step = await prisma.onboardingStep.create({
          data: baseCreate,
        });
      }
    }

    return { success: true, data: step };
  } catch (error) {
    console.error('Failed to upsert onboarding step:', error);
    return { success: false, error: 'Failed to create/update onboarding step' };
  }
}

/**
 * Get user onboarding steps
 */
export async function getUserOnboardingSteps(userId: number) {
  try {
    const steps = await prisma.onboardingStep.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const totalSteps = steps.length;
    const completedSteps = steps.filter(
      (step: { status: OnboardingStatus }) => step.status === OnboardingStatus.COMPLETED
    ).length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      success: true,
      data: {
        steps,
        progress,
        totalSteps,
        completedSteps,
      },
    };
  } catch (error) {
    console.error('Failed to fetch onboarding steps:', error);
    return { success: false, error: 'Failed to fetch onboarding steps' };
  }
}

/**
 * Initialize default onboarding steps for a new user
 */
export async function initializeUserOnboarding(userId: number) {
  try {
    const defaultSteps = [
      { stepType: 'PROFILE', stepName: 'Basic Information' },
      { stepType: 'PROFILE', stepName: 'Contact Details' },
      { stepType: 'PROFILE', stepName: 'Additional Information' },
    ];

    await prisma.onboardingStep.createMany({
      data: defaultSteps.map((step) => ({
        userId,
        ...step,
        status: OnboardingStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    // Update user onboarding status
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStatus: OnboardingStatus.PENDING },
    });

    // Create audit log
    await createAuditLog({
      actorId: userId,
      actionType: AuditActionType.ONBOARDING_START,
      entityType: EntityType.USER,
      entityId: userId,
      targetUserId: userId,
      metadata: {
        startedAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to initialize onboarding:', error);
    return { success: false, error: 'Failed to initialize onboarding' };
  }
}

/**
 * Check if user is a shell account (created by provider)
 */
export async function checkShellAccount(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isShellAccount: true,
        shellAccountCreatedBy: true,
        onboardingStatus: true,
        ShellAccountCreator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      data: {
        isShellAccount: user.isShellAccount,
        createdBy: user.ShellAccountCreator,
        onboardingStatus: user.onboardingStatus,
      },
    };
  } catch (error) {
    console.error('Failed to check shell account:', error);
    return { success: false, error: 'Failed to check shell account status' };
  }
}
