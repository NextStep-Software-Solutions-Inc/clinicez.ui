'use server';

import prisma from '@/lib/prisma';
import { OnboardingStatus, AuditActionType, EntityType, BloodType } from '@prisma/client';
import { createAuditLog } from '../audit.action';

export interface PatientCreationData {
  // Basic info (required)
  firstName: string;
  lastName: string;
  email: string;
  dob: Date;
  gender: 'MALE' | 'FEMALE';
  mobile: string;
  
  // Optional profile fields
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
 * Create a patient as a shell account by a healthcare provider
 * This creates an incomplete user account that the patient must complete on first login
 */
export async function createPatientShellAccount(params: {
  clinicId: number;
  createdBy: number;
  patientData: PatientCreationData;
}) {
  const { clinicId, createdBy, patientData } = params;

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: patientData.email },
    });

    if (existingUser) {
      // If user exists, just add them to the clinic
      const existingPatient = await prisma.clinicPatient.findUnique({
        where: {
          unique_clinic_patient: {
            clinicId,
            patientId: existingUser.id,
          },
        },
      });

      if (existingPatient) {
        return {
          success: false,
          error: 'Patient already exists in this clinic',
        };
      }

      // Add existing user as patient
      const clinicPatient = await prisma.clinicPatient.create({
        data: {
          clinicId,
          patientId: existingUser.id,
          addedBy: createdBy,
          onboardingStatus: existingUser.onboardingStatus,
        },
      });

      // Create audit log
      await createAuditLog({
        actorId: createdBy,
        actionType: AuditActionType.CREATE,
        entityType: EntityType.CLINIC_PATIENT,
        entityId: clinicPatient.id,
        targetUserId: existingUser.id,
        metadata: {
          clinicId,
          addedExistingUser: true,
        },
      });

      return {
        success: true,
        data: {
          user: existingUser,
          clinicPatient,
          isNew: false,
        },
      };
    }

    // Create new shell user account
    // Generate a temporary userId for Clerk (will be updated when they sign up)
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newUser = await prisma.user.create({
      data: {
        userId: tempUserId,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        email: patientData.email,
        dob: patientData.dob,
        gender: patientData.gender,
        mobile: patientData.mobile,
        middleName: patientData.middleName,
        suffix: patientData.suffix,
        nickname: patientData.nickname,
        placeOfBirth: patientData.placeOfBirth,
        civilStatus: patientData.civilStatus,
        bloodType: patientData.bloodType,
        telephone: patientData.telephone,
        religion: patientData.religion,
        nationality: patientData.nationality,
        picture: patientData.picture,
        isShellAccount: true,
        shellAccountCreatedBy: createdBy,
        onboardingStatus: OnboardingStatus.INCOMPLETE,
        isActive: true,
      },
    });

    // Add user as clinic patient
    const clinicPatient = await prisma.clinicPatient.create({
      data: {
        clinicId,
        patientId: newUser.id,
        addedBy: createdBy,
        onboardingStatus: OnboardingStatus.INCOMPLETE,
      },
    });

    // Assign default patient permissions
    const patientRole = await prisma.clinicRole.findFirst({
      where: {
        name: 'Patient',
      },
    });

    if (patientRole) {
      const initialPermissions = await prisma.clinicRoleInitialPermission.findMany({
        where: { 
          clinicRoleId: patientRole.id,
          clinicId: clinicId,
        },
      });

      if (initialPermissions.length > 0) {
        await prisma.clinicPatientPermission.createMany({
          data: initialPermissions.map((perm: { permissionId: number }) => ({
            clinicPatientId: clinicPatient.id,
            permissionId: perm.permissionId,
          })),
        });
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: createdBy,
      actionType: AuditActionType.CREATE,
      entityType: EntityType.CLINIC_PATIENT,
      entityId: clinicPatient.id,
      targetUserId: newUser.id,
      metadata: {
        clinicId,
        isShellAccount: true,
        patientData: {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
        },
      },
    });

    return {
      success: true,
      data: {
        user: newUser,
        clinicPatient,
        isNew: true,
      },
    };
  } catch (error) {
    console.error('Failed to create patient shell account:', error);
    return { success: false, error: 'Failed to create patient account' };
  }
}

/**
 * Complete patient onboarding when they first log in
 */
export async function completePatientOnboarding(params: {
  userId: number;
  clinicId: number;
  profileData: PatientCreationData;
}) {
  const { userId, clinicId, profileData } = params;

  try {
    // Validate required fields
    const requiredFields: (keyof PatientCreationData)[] = [
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

    // Get current user data
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

    // Update clinic patient status
    const clinicPatient = await prisma.clinicPatient.update({
      where: {
        unique_clinic_patient: {
          clinicId,
          patientId: userId,
        },
      },
      data: {
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingCompletionDate: new Date(),
      },
    });

    // Log field changes
    const changes: Array<{ fieldName: string; oldValue: string; newValue: string }> = [];
    
    (Object.keys(profileData) as Array<keyof PatientCreationData>).forEach((key) => {
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

    // Create audit log
    await createAuditLog({
      actorId: userId,
      actionType: AuditActionType.ONBOARDING_COMPLETE,
      entityType: EntityType.CLINIC_PATIENT,
      entityId: clinicPatient.id,
      targetUserId: userId,
      metadata: {
        clinicId,
        completedAt: new Date().toISOString(),
        changes,
      },
    });

    return {
      success: true,
      data: {
        user: updatedUser,
        clinicPatient,
      },
    };
  } catch (error) {
    console.error('Failed to complete patient onboarding:', error);
    return { success: false, error: 'Failed to complete patient onboarding' };
  }
}

/**
 * Validate patient clinic onboarding status
 */
export async function validatePatientOnboarding(params: {
  userId: number;
  clinicId: number;
}) {
  const { userId, clinicId } = params;

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
        isShellAccount: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const clinicPatient = await prisma.clinicPatient.findUnique({
      where: {
        unique_clinic_patient: {
          clinicId,
          patientId: userId,
        },
      },
      select: {
        onboardingStatus: true,
        onboardingCompletionDate: true,
      },
    });

    if (!clinicPatient) {
      return { success: false, error: 'Patient not found in clinic' };
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
        isShellAccount: user.isShellAccount,
        userOnboardingStatus: user.onboardingStatus,
        clinicOnboardingStatus: clinicPatient.onboardingStatus,
        completionDate: clinicPatient.onboardingCompletionDate,
      },
    };
  } catch (error) {
    console.error('Failed to validate patient onboarding:', error);
    return { success: false, error: 'Failed to validate patient onboarding' };
  }
}
