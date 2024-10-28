"use server";

import { getCachedSession } from "@actions/session.action";
import prismaCommon from "@lib/prisma-common";
import { Prisma, UserPlanStatus, HealthcareProviderType } from "@prisma/common/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"
import { connect } from "http2";
dayjs.extend(utc)
import { cache } from "react";

export const createUserPlanAction = async (planId: number, userId: string, status: UserPlanStatus = "PENDING") => {
  try {
    const userPlan = await prismaCommon.$transaction(async (prisma) => {

      const userPlan = await prisma.userPlan.create({
        data: {
          User: {
            connect: {
              userId
            }
          },
          Plan: {
            connect: {
              id: planId
            }
          },
          startDate: dayjs().toDate(),
          endDate: dayjs().add(1, "year").toDate(),
          status
        }
      });
      return userPlan;
    });
    
    return {
      status: true,
      message: "User plan created successfully.",
      data: userPlan
    }
  } catch (error) {
    console.error(`Error creating user plan: ${error}`);
    return {
      status: false,
      message: "An error occurred while creating user plan.",
      data: null
    }
  }
}

export const upsertUserPlanAction = async (payload: Prisma.UserPlanUpsertArgs) => {
  const userPlan = await prismaCommon.userPlan.upsert(payload);
  return userPlan;
}

export const setUserPlanStatusAction = async (id: number, status: UserPlanStatus) => {
  const userPlan = await prismaCommon.userPlan.update({
    where: { id },
    data: { status }
  });
  return userPlan;
}

type HPApplicationTransactionPayload = {
 code: string;
 planId: number;
 hpType: HealthcareProviderType;

}
export const hpApplicationTransactionAction = async ({planId, hpType,code}: HPApplicationTransactionPayload) => {

  const session = await getCachedSession();
  let errorMessage = "";
  
  try {
    await prismaCommon.$transaction(async (prisma) => {
      // Count claimed receipt codes
      errorMessage = "Receipt code is invalid or has been claimed.";
      const claimedCount = await prisma.receiptCodeClaim.count({
        where: {
          isActive: true,
          ReceiptCode: { code }
        }
      })
  
      // Get plan cost
      errorMessage = "Plan is invalid or inactive.";
      const planCost = await prisma.plan.findFirstOrThrow({
        where: { id: planId, isActive: true}
      })
     
      
      // Check if code is less than maxUses and amount is greater than plan cost and status is UNUSED and coverage is ALL or HEALTHCARE_PROVIDER 
      errorMessage = "Receipt code is invalid or has been claimed.";
      const receiptCode = await prisma.receiptCode.findFirstOrThrow({
        where: { 
          isActive: true,
          maxUses: { gt: claimedCount },
          amount: { gte: planCost.price},
          status: "UNUSED",
          code, 
          OR: [{ coverage: "ALL" }, {coverage: "HEALTHCARE_PROVIDER"}]
        },
      })
  
      // If less than maxUses, claim receipt code
      errorMessage = "An error occurred while claiming receipt code. User may have already claimed the code.";
      await prisma.receiptCodeClaim.create({
        data: {
          ReceiptCode: {
            connect: { code: receiptCode.code } 
          },
          User: {
            connect: { userId: session?.user.sub }
          }
        }
      });
  
      // If maxUses is reached, update receipt code status to "USED"
      if(receiptCode.maxUses === claimedCount + 1) {
        errorMessage = "An error occurred while updating receipt code status.";
        await prisma.receiptCode.update({
          where: { code },
          data: { status: "USED" }
        })
      }
      
      // Create user plan
      errorMessage = "An error occurred while creating user plan.";
      await prisma.userPlan.create({
        data: {
          Plan: {
            connect: { id: planId }
          },
          User: {
            connect: { userId: session?.user.sub }
          },
          startDate: dayjs().toDate(),
          endDate: dayjs().add(1, "year").toDate(),
          status: "ACTIVE",
        }
      }),
  
      // Create healthcare provider
      errorMessage = "An error occurred while creating healthcare provider.";
      await prisma.healthcareProvider.create({
        data: {
          type: hpType,
          User: {
            connect: { userId: session?.user.sub }
          },
          HPProfile: {
            create: {
              name: "",
              title: "",
            }
          }
        },
      })
      // Return true if all transactions are successful
      errorMessage = "Healthcare provider application successful.";
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })
    return {
      status: true,
      message: errorMessage
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: errorMessage
    };
  }
}

export type GetUserPlans = ReturnType<typeof getUserPlansAction>;
export const getUserPlansAction = cache(async (userId: string) => {
  const userPlans = await prismaCommon.userPlan.findMany({
    orderBy: {
      endDate: "desc"
    },
    where: {
      User: {
        userId: userId
      },
      isActive: true 
    },
    select: { 
      Plan: {
        select: {
          name: true,
          type: true,
        }
      },
      startDate: true,
      endDate: true,
      status: true,
      id: true
    }
  });
  return userPlans;
})