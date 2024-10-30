"use server";

import prismaCommon from "@lib/prisma-common";
import { Prisma } from "@prisma/common/client";
import { getCachedSession } from "./session.action";
import { hasCodeProperty } from "@lib/utils";

export const createReceiptCodeAction = async (payload: Prisma.ReceiptCodeCreateArgs["data"]) => {
  await prismaCommon.receiptCode.create({
    data: payload,
  });
}

export const getReceiptCodesAction = async () => {
  return await prismaCommon.receiptCode.findMany({
    where: {
      isActive: true,
    }
  });
}

export const verifyReceiptCodeAction = async (code: string) => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("Unauthorized");
    await prismaCommon.$transaction(async (prisma) => {
      // Count claimed receipt codes
      const claimCount =  await prisma.receiptCodeClaim.count({
        where: {
          isActive: true,
          ReceiptCode: { code }
        }
      });
      // Check if code is less than maxUses and status is UNUSED and coverage is ALL or TENANT 
      await prisma.receiptCode.findFirstOrThrow({
        where: { 
          code, 
          isActive: true, 
          maxUses: { gte: claimCount },
          status: "UNUSED",
          OR: [{ coverage: "ALL" }, {coverage: "TENANT"}, {coverage: "HEALTHCARE_PROVIDER"}]
        },
      })
    });
    return { success: true, message: "Receipt code is valid" }
  } catch (error) {
    console.error(`Error fetching receipt code: ${error}`);
    let message = "An error occurred while verifying receipt code";
    if(error instanceof Error) message = error.message;
    return { success: false, message: message }
  }
  
}

export const claimReceiptCodeAction = async (code: string) => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("Unauthorized");
    const userId = String(session.user.sub);
    return await prismaCommon.$transaction(async (prisma) => {
      const claimedCount = await prisma.receiptCodeClaim.count({
        where: {
          isActive: true,
          ReceiptCode: {
            code
          }
        }
      })
      console.log({claimedCount});
      
      const receiptCode = await prisma.receiptCode.findFirst({
        where: { code, maxUses: { gt: claimedCount }, status: "UNUSED" }
      })
      
      if(!receiptCode) throw new Error("Receipt code is invalid or reached maximum claims");
      await prisma.receiptCodeClaim.create({
        data: {
          ReceiptCode: {
            connect: { code: receiptCode.code } 
          },
          User: {
            connect: { userId }
          }
        }
      });
      return { success: true, message: "Receipt code claimed successfully" }
    },
    {
      timeout: 5000,
      maxWait: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

  } catch (error) {
    console.error(`Error claiming receipt code: ${error}`);
    let message = "An error occurred while claiming receipt code";
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === "P2002") message = "Error claiming receipt code. User may have already claimed the code.";
    return { success: false, message: message }
  }
}