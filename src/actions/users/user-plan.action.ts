"use server";

import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { Prisma, UserPlanStatus } from "@prisma";
import dayjs from "@lib/day-utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";

export const createUserPlanAction = async (
  planId: number,
  status: UserPlanStatus = "PENDING"
) => {
  const session = await getCachedSession();
  try {
    if (!session) throw new Error("Unauthorized");
    const userPlan = await prisma.$transaction(async (prisma) => {
      // Find the current user first
      const currentUser = await prisma.user.findUniqueOrThrow({
        where: {
          userId: session.user.sub,
          isActive: true,
        },
        select: { id: true },
      });

      const userPlan = await prisma.userPlan.create({
        data: {
          User: {
            connect: {
              id: currentUser.id,
            },
          },
          Plan: {
            connect: {
              id: planId,
            },
          },
          startDate: dayjs().toDate(),
          endDate: dayjs().add(1, "year").toDate(),
          status,
        },
      });
      return userPlan;
    });

    return {
      status: true,
      message: "User plan created successfully.",
      data: userPlan,
    };
  } catch (error) {
    console.error(`Error creating user plan: ${error}`);
    return {
      status: false,
      message: "An error occurred while creating user plan.",
      data: null,
    };
  }
};

export const upsertUserPlanAction = async (
  payload: Prisma.UserPlanUpsertArgs
) => {
  const userPlan = await prisma.userPlan.upsert(payload);
  return userPlan;
};

export const setUserPlanStatusAction = async (
  id: number,
  status: UserPlanStatus
) => {
  const userPlan = await prisma.userPlan.update({
    where: { id },
    data: { status },
  });
  return userPlan;
};

type HPApplicationTransactionPayload = {
  code: string;
  planId: number;
  hpTypeId: number;
};

export const hpApplicationTransactionAction = withErrorHandling(
  async ({ planId, hpTypeId, code }: HPApplicationTransactionPayload) => {
    const session = await sessionCheck();
    let message = "";

    await prisma.$transaction(
      async (prisma) => {
        // Find the current user first
        message = "User not found.";
        const currentUser = await prisma.user.findUniqueOrThrow({
          where: {
            userId: session.user.sub,
            isActive: true,
          },
          select: { id: true },
        });

        // Check if user already has a Healthcare Provider profile
        message = "You already have a Healthcare Provider profile. Only one HP profile is allowed per user.";
        const existingHP = await prisma.healthcareProvider.findFirst({
          where: {
            userId: currentUser.id,
            isActive: true,
          },
        });
        
        if (existingHP) {
          throw new Error(message);
        }

        // Count claimed receipt codes
        message = "Receipt code is invalid or has been claimed.";
        const claimedCount = await prisma.receiptCodeClaim.count({
          where: {
            isActive: true,
            ReceiptCode: { code },
          },
        });

        // Get plan cost
        message = "Plan is invalid or inactive.";
        const planCost = await prisma.plan.findFirstOrThrow({
          where: { id: planId, isActive: true },
        });

        // Check if code is less than maxUses and amount is greater than plan cost and status is UNUSED and coverage is ALL or HEALTHCARE_PROVIDER
        message = "Receipt code is invalid or has been claimed.";
        const receiptCode = await prisma.receiptCode.findFirstOrThrow({
          where: {
            isActive: true,
            maxUses: { gt: claimedCount },
            amount: { gte: planCost.price },
            status: "UNUSED",
            code,
            OR: [{ coverage: "ALL" }, { coverage: "HEALTHCARE_PROVIDER" }],
          },
        });

        // If less than maxUses, claim receipt code
        message =
          "An error occurred while claiming receipt code. User may have already claimed the code.";
        await prisma.receiptCodeClaim.create({
          data: {
            ReceiptCode: {
              connect: { code: receiptCode.code },
            },
            User: {
              connect: { id: currentUser.id },
            },
          },
        });

        // If maxUses is reached, update receipt code status to "USED"
        if (receiptCode.maxUses === claimedCount + 1) {
          message = "An error occurred while updating receipt code status.";
          await prisma.receiptCode.update({
            where: { code },
            data: { status: "USED" },
          });
        }

        // Create user plan
        message = "An error occurred while creating user plan.";
        await prisma.userPlan.create({
          data: {
            Plan: {
              connect: { id: planId },
            },
            User: {
              connect: { id: currentUser.id },
            },
            startDate: dayjs().toDate(),
            endDate: dayjs().add(1, "year").toDate(),
            status: "ACTIVE",
          },
        }),
        // Create healthcare provider
        (message = "An error occurred while creating healthcare provider.");
        await prisma.healthcareProvider.create({
          data: {
            HPType: {
              connect: { id: hpTypeId },
            },
            User: {
              connect: { id: currentUser.id },
            },
            HPProfile: {
              create: {
                name: "",
                title: "",
              },
            },
          },
        });
        // Return true if all transactions are successful
        message = "Healthcare provider application successful.";
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
    return { message, data: null };
  }
);

export type GetUserPlans = ReturnType<typeof getUserPlansAction>;
export const getUserPlansAction = cache(async (userId: string) => {
  const userPlans = await prisma.userPlan.findMany({
    orderBy: {
      endDate: "desc",
    },
    where: {
      User: {
        userId: userId,
      },
      isActive: true,
    },
    select: {
      Plan: {
        select: {
          name: true,
          type: true,
        },
      },
      startDate: true,
      endDate: true,
      status: true,
      id: true,
    },
  });
  return userPlans;
});
