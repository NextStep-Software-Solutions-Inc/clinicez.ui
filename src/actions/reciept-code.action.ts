"use server";

import prisma from "@lib/prisma-common";
import { Prisma } from "@prisma/common/client";

export const createReceiptCodeAction = async (payload: Prisma.ReceiptCodeCreateArgs["data"]) => {
  await prisma.receiptCode.create({
    data: payload,
  });
}

export const getReceiptCodesAction = async () => {
  return await prisma.receiptCode.findMany({
    where: {
      isActive: true,
    }
  });
}

export const getReceiptCodeAction = async (code: string) => {
  return await prisma.$transaction(async (prisma) => {
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
        maxUses: { gt: claimCount },
        status: "UNUSED",
        OR: [{ coverage: "ALL" }, {coverage: "TENANT"}]
      },
    })
  });
}

export const claimReceiptCodeAction = async (code: string, userId: string) => {
  return await prisma.$transaction(async (prisma) => {
    const claimedCount = await prisma.receiptCodeClaim.count({
      where: {
        isActive: true,
        ReceiptCode: {
          code
        }
      }
    })
    const receiptCode = await prisma.receiptCode.findFirstOrThrow({
      where: { code, maxUses: { lte: claimedCount }},
    })
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
    return true;
  },
  {
    timeout: 5000,
    maxWait: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  })
}