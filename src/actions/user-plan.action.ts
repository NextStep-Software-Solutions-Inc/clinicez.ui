"use server";

import prisma from "@lib/prisma-common";
import { Prisma, UserPlanStatus } from "@prisma/common/client";
import dayjs from "dayjs";
import { cache } from "react";

export const createUserPlanAction = async (planId: number, userId: number, status: UserPlanStatus = "PENDING") => {
  const userPlan = await prisma.userPlan.create({
    data: {
      startDate: dayjs().toDate(),
      endDate: dayjs().add(1, "year").toDate(),
      planId,
      userId,
      status
    }
  });
  return userPlan;
}

export const upsertUserPlanAction = async (payload: Prisma.UserPlanUpsertArgs) => {
  const userPlan = await prisma.userPlan.upsert(payload);
  return userPlan;
}

export const setUserPlanStatusAction = async (id: number, status: UserPlanStatus) => {
  const userPlan = await prisma.userPlan.update({
    where: { id },
    data: { status }
  });
  return userPlan;
}

export const hpApplicationTransactionAction = async ({
  planPayload : {planId, userId, status = "PENDING"},
  hpPayload, code
}: {
  planPayload: {planId: number, userId: number, status: UserPlanStatus};
  hpPayload: Prisma.HealthcareProviderCreateArgs["data"];
  code: string;

}) => {
  const success = await prisma.$transaction(async (prisma) => {
    // Count claimed receipt codes
    const claimedCount = await prisma.receiptCodeClaim.count({
      where: {
        isActive: true,
        ReceiptCode: {
          code
        }
      }
    })

    // Get plan cost
    const planCost = await prisma.plan.findFirstOrThrow({
      where: { id: planId, isActive: true}
    })
    
    // Check if code is less than maxUses and amount is greater than plan cost and status is UNUSED and coverage is ALL or HEALTHCARE_PROVIDER 
    const receiptCode = await prisma.receiptCode.findFirstOrThrow({
      where: { 
        isActive: true,
        code, 
        maxUses: { gt: claimedCount },
        amount: { gte: planCost.price},
        status: "UNUSED",
        OR: [{ coverage: "ALL" }, {coverage: "HEALTHCARE_PROVIDER"}]
      },
    })

    // If less than maxUses, claim receipt code
    await prisma.receiptCodeClaim.create({
      data: {
        ReceiptCode: {
          connect: { code: receiptCode.code } 
        },
        User: {
          connect: { id: userId }
        }
      }
    });

    // If maxUses is reached, update receipt code status to "USED"
    if(receiptCode.maxUses === claimedCount + 1) {
      await prisma.receiptCode.update({
        where: { code },
        data: { status: "USED" }
      })
    }
    
    // Create user plan
    await prisma.userPlan.create({
      data: {
        startDate: dayjs().toDate(),
        endDate: dayjs().add(1, "year").toDate(),
        planId,
        userId,
        status
      }
    }),

    // Create healthcare provider
    await prisma.healthcareProvider.create({
      data: {
        ...hpPayload, 
        // For DOCTOR
        ...hpPayload.type === "DOCTOR" && {
          DoctorProfile: {
            create: {
              name: "",
              title: "",
            }
          }
        },
        // For NURSE
        ...hpPayload.type === "NURSE" && {
          NurseProfile: {
            create: {
              name: "",
              title: "",
            }
          }
        }
      }
    })
    // Return true if all transactions are successful
    return true;
  }, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  })
  return success;
}

export const getUserPlansAction = cache(async (userId: string) => {
  const userPlans = await prisma.userPlan.findMany({
    orderBy: {
      endDate: "desc"
    },
    where: {
      User: {
        userId: userId
      },
      isActive: true 
    },
    include: { 
      Plan: {
        select: {
          name: true,
          type: true,
        }
      }
    }
  });
  return userPlans;
})