"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { sessionCheck } from "@/lib/auth";
import { withErrorHandling } from "@/lib/with-error-handling";
import { createFieldChangeLogs } from "@/actions/audit.action";
import { diffFields } from "@/lib/audit-utils";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingFullSchema,
  type OnboardingStep1Values,
  type OnboardingStep2Values,
  type OnboardingStep3Values,
} from "@/schemas/onboarding.schema";

type PrismaTransactionalClient = Parameters<
  Parameters<typeof prisma["$transaction"]>[0]
>[0];

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Get user profile data for onboarding
 */
export const getUserOnboardingDataAction = withErrorHandling(async () => {
  const session = await sessionCheck();

  const user = await prisma.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: {
      id: true,
      userId: true,
      email: true,
      firstName: true,
      lastName: true,
      middleName: true,
      suffix: true,
      nickname: true,
      mobile: true,
      telephone: true,
      dob: true,
      gender: true,
      bloodType: true,
      civilStatus: true,
      placeOfBirth: true,
      religion: true,
      nationality: true,
      picture: true,
      onboardingStatus: true,
      profileCompletionStatus: true,
      accountType: true,
      firstLogin: true,
      onboardingCompletedAt: true,
    },
  });

  return {
    message: "User onboarding data retrieved",
    data: user,
  };
});

export type GetUserOnboardingData = Awaited<
  ReturnType<typeof getUserOnboardingDataAction>
>;

/**
 * Save Step 1: Basic Information
 */
export const saveOnboardingStep1Action = withErrorHandling(
  async (values: OnboardingStep1Values) => {
    const session = await sessionCheck();
    const parsed = onboardingStep1Schema.parse(values);

    const user = await prisma.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        dob: parsed.dob,
        gender: parsed.gender,
        onboardingStatus: "IN_PROGRESS",
      },
    });

    // Audit trail
    const changes = diffFields(
      user as unknown as Record<string, unknown>,
      updatedUser as unknown as Record<string, unknown>,
      ["firstName", "lastName", "dob", "gender"]
    );

    if (changes.length > 0) {
      await createFieldChangeLogs({
        entityType: "ONBOARDING",
        entityId: user.id,
        action: "ONBOARDING",
        changes,
        reason: "Onboarding Step 1: Basic Information",
        performedBy: user.id,
      });
    }

    // Log step completion
    await prisma.onboardingStepLog.create({
      data: {
        userId: user.id,
        entityType: "USER",
        action: "STEP_COMPLETED",
        stepName: "basic-info",
        newStatus: "COMPLETED",
      },
    });

    return {
      message: "Basic information saved",
      data: updatedUser,
    };
  }
);

/**
 * Save Step 2: Contact Information
 */
export const saveOnboardingStep2Action = withErrorHandling(
  async (values: OnboardingStep2Values) => {
    const session = await sessionCheck();
    const parsed = onboardingStep2Schema.parse(values);

    const user = await prisma.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        mobile: parsed.mobile,
        email: parsed.email,
      },
    });

    // Audit trail
    const changes = diffFields(
      user as unknown as Record<string, unknown>,
      updatedUser as unknown as Record<string, unknown>,
      ["mobile", "email"]
    );

    if (changes.length > 0) {
      await createFieldChangeLogs({
        entityType: "ONBOARDING",
        entityId: user.id,
        action: "ONBOARDING",
        changes,
        reason: "Onboarding Step 2: Contact Information",
        performedBy: user.id,
      });
    }

    // Log step completion
    await prisma.onboardingStepLog.create({
      data: {
        userId: user.id,
        entityType: "USER",
        action: "STEP_COMPLETED",
        stepName: "contact",
        newStatus: "COMPLETED",
      },
    });

    return {
      message: "Contact information saved",
      data: updatedUser,
    };
  }
);

/**
 * Save Step 3: Additional Information
 */
export const saveOnboardingStep3Action = withErrorHandling(
  async (values: OnboardingStep3Values) => {
    const session = await sessionCheck();
    const parsed = onboardingStep3Schema.parse(values);

    const user = await prisma.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
    });

    const updateData: Prisma.UserUpdateInput = {};
    if (parsed.middleName !== undefined)
      updateData.middleName = parsed.middleName;
    if (parsed.suffix !== undefined) updateData.suffix = parsed.suffix;
    if (parsed.nickname !== undefined) updateData.nickname = parsed.nickname;
    if (parsed.placeOfBirth !== undefined)
      updateData.placeOfBirth = parsed.placeOfBirth;
    if (parsed.civilStatus !== undefined)
      updateData.civilStatus = parsed.civilStatus;
    if (parsed.bloodType !== undefined) updateData.bloodType = parsed.bloodType;
    if (parsed.telephone !== undefined) updateData.telephone = parsed.telephone;
    if (parsed.religion !== undefined) updateData.religion = parsed.religion;
    if (parsed.nationality !== undefined)
      updateData.nationality = parsed.nationality;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Audit trail
    const changes = diffFields(
      user as unknown as Record<string, unknown>,
      updatedUser as unknown as Record<string, unknown>,
      [
        "middleName",
        "suffix",
        "nickname",
        "placeOfBirth",
        "civilStatus",
        "bloodType",
        "telephone",
        "religion",
        "nationality",
      ]
    );

    if (changes.length > 0) {
      await createFieldChangeLogs({
        entityType: "ONBOARDING",
        entityId: user.id,
        action: "ONBOARDING",
        changes,
        reason: "Onboarding Step 3: Additional Information",
        performedBy: user.id,
      });
    }

    // Log step completion
    await prisma.onboardingStepLog.create({
      data: {
        userId: user.id,
        entityType: "USER",
        action: "STEP_COMPLETED",
        stepName: "additional",
        newStatus: "COMPLETED",
      },
    });

    return {
      message: "Additional information saved",
      data: updatedUser,
    };
  }
);

/**
 * Complete onboarding (final step)
 */
export const completeUserOnboardingAction = withErrorHandling(async () => {
  const session = await sessionCheck();

  const user = await prisma.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
  });

  // Validate that required fields are filled
  const validationResult = onboardingFullSchema.safeParse({
    firstName: user.firstName,
    lastName: user.lastName,
    dob: user.dob,
    gender: user.gender,
    mobile: user.mobile,
    email: user.email,
    // Optional fields
    middleName: user.middleName,
    suffix: user.suffix,
    nickname: user.nickname,
    placeOfBirth: user.placeOfBirth,
    civilStatus: user.civilStatus,
    bloodType: user.bloodType,
    telephone: user.telephone,
    religion: user.religion,
    nationality: user.nationality,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((i) => i.message)
      .join(", ");
    throw new Error(`Please complete all required fields: ${errors}`);
  }

  // Determine profile completion status
  const optionalFields = [
    user.middleName,
    user.suffix,
    user.nickname,
    user.placeOfBirth,
    user.civilStatus,
    user.bloodType,
    user.telephone,
    user.religion,
    user.nationality,
  ];
  const filledOptional = optionalFields.filter(
    (f) => f !== null && f !== undefined && f !== ""
  ).length;
  const profileStatus =
    filledOptional === optionalFields.length ? "COMPLETE" : "PARTIAL";

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingStatus: "COMPLETED",
      profileCompletionStatus: profileStatus,
      onboardingCompletedAt: new Date(),
      firstLogin: user.firstLogin ?? new Date(),
    },
  });

  // Audit trail
  await createFieldChangeLogs({
    entityType: "ONBOARDING",
    entityId: user.id,
    action: "ONBOARDING",
    changes: [
      {
        fieldName: "onboardingStatus",
        previousValue: user.onboardingStatus,
        newValue: "COMPLETED",
      },
      {
        fieldName: "profileCompletionStatus",
        previousValue: user.profileCompletionStatus,
        newValue: profileStatus,
      },
    ],
    reason: "User completed onboarding",
    performedBy: user.id,
  });

  // Log completion
  await prisma.onboardingStepLog.create({
    data: {
      userId: user.id,
      entityType: "USER",
      action: "ONBOARDING_COMPLETED",
      previousStatus: user.onboardingStatus,
      newStatus: "COMPLETED",
    },
  });

  return {
    message: "Onboarding completed successfully!",
    data: updatedUser,
  };
});

/**
 * Skip onboarding (optional fields only — requires all required fields to be filled first)
 */
export const skipOnboardingAction = withErrorHandling(async () => {
  const session = await sessionCheck();

  const user = await prisma.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
  });

  // Validate required fields are filled before allowing skip
  const requiredResult = onboardingStep1Schema
    .merge(onboardingStep2Schema)
    .safeParse({
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob,
      gender: user.gender,
      mobile: user.mobile,
      email: user.email,
    });

  if (!requiredResult.success) {
    throw new Error(
      "Cannot skip onboarding until all required fields are completed."
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingStatus: "SKIPPED",
      profileCompletionStatus: "PARTIAL",
      onboardingCompletedAt: new Date(),
      firstLogin: user.firstLogin ?? new Date(),
    },
  });

  // Audit trail
  await prisma.onboardingStepLog.create({
    data: {
      userId: user.id,
      entityType: "USER",
      action: "STATUS_CHANGE",
      previousStatus: user.onboardingStatus,
      newStatus: "SKIPPED",
    },
  });

  return {
    message: "Onboarding skipped",
    data: updatedUser,
  };
});
