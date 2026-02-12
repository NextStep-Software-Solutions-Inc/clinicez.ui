"use server";

import prisma from "@lib/prisma";
import { sessionCheck } from "@/lib/auth";
import { withErrorHandling } from "@/lib/with-error-handling";
import { createFieldChangeLogs } from "@/actions/audit.action";
import { diffFields } from "@/lib/audit-utils";
import {
  onboardingBasicInfoSchema,
  type OnboardingBasicInfoValues,
} from "@/schemas/onboarding.schema";

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
      mobile: true,
      dob: true,
      gender: true,
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
 * Save basic info and complete onboarding in a single step.
 */
export const completeBasicOnboardingAction = withErrorHandling(
  async (values: OnboardingBasicInfoValues) => {
    const session = await sessionCheck();
    const parsed = onboardingBasicInfoSchema.parse(values);

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
        mobile: parsed.mobile,
        onboardingStatus: "COMPLETED",
        profileCompletionStatus: "PARTIAL",
        onboardingCompletedAt: new Date(),
        firstLogin: user.firstLogin ?? new Date(),
      },
    });

    // Audit trail for field changes
    const changes = diffFields(
      user as unknown as Record<string, unknown>,
      updatedUser as unknown as Record<string, unknown>,
      ["firstName", "lastName", "dob", "gender", "mobile"]
    );

    if (changes.length > 0) {
      await createFieldChangeLogs({
        entityType: "ONBOARDING",
        entityId: user.id,
        action: "ONBOARDING",
        changes,
        reason: "Onboarding: Basic Information",
        performedBy: user.id,
      });
    }

    // Audit trail for onboarding completion
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
  }
);
