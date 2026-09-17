"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import type { ArClaimStatus } from "@prisma/client";

export type HmoAgingBucket = {
  current: number; // 0-30 days
  thirtyToOne: number; // 31-60 days
  sixtyToOne: number; // 61-90 days
  ninetyPlus: number; // 90+ days
  total: number;
};

export type HmoProviderSummary = {
  providerName: string;
  claimCount: number;
  totalClaimAmount: number;
  settledAmount: number;
  pendingBalance: number;
  aging: HmoAgingBucket;
};

export const getHmoArSummaryAction = async (clinicUid: string) => {
  let message = "HMO receivables summary fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const claims = await prisma.hmoClaimRecord.findMany({
      where: { clinicId: clinic.id },
      include: {
        Invoice: {
          include: {
            ClinicPatient: {
              include: {
                Patient: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { Invoice: { issuedAt: "desc" } },
    });

    const now = new Date().getTime();
    const providerMap = new Map<string, HmoProviderSummary>();

    let overallTotal = 0;
    let overallPending = 0;
    let overallSettled = 0;

    const overallAging: HmoAgingBucket = {
      current: 0,
      thirtyToOne: 0,
      sixtyToOne: 0,
      ninetyPlus: 0,
      total: 0,
    };

    for (const claim of claims) {
      const pName = claim.hmoProvider.trim() || "Unspecified HMO";
      const claimAmt = Number(claim.claimAmount);
      const settledAmt = Number(claim.settledAmount ?? 0);
      const isSettled = claim.status === "PAID";
      const pendingBalance = isSettled ? 0 : Math.max(0, claimAmt - settledAmt);

      overallTotal += claimAmt;
      overallSettled += settledAmt;
      overallPending += pendingBalance;

      // Calculate days outstanding
      const issuedTime = new Date(claim.Invoice.issuedAt).getTime();
      const daysDiff = Math.max(0, Math.floor((now - issuedTime) / (1000 * 60 * 60 * 24)));

      if (!isSettled) {
        if (daysDiff <= 30) overallAging.current += pendingBalance;
        else if (daysDiff <= 60) overallAging.thirtyToOne += pendingBalance;
        else if (daysDiff <= 90) overallAging.sixtyToOne += pendingBalance;
        else overallAging.ninetyPlus += pendingBalance;
        overallAging.total += pendingBalance;
      }

      if (!providerMap.has(pName)) {
        providerMap.set(pName, {
          providerName: pName,
          claimCount: 1,
          totalClaimAmount: claimAmt,
          settledAmount: settledAmt,
          pendingBalance,
          aging: {
            current: !isSettled && daysDiff <= 30 ? pendingBalance : 0,
            thirtyToOne: !isSettled && daysDiff > 30 && daysDiff <= 60 ? pendingBalance : 0,
            sixtyToOne: !isSettled && daysDiff > 60 && daysDiff <= 90 ? pendingBalance : 0,
            ninetyPlus: !isSettled && daysDiff > 90 ? pendingBalance : 0,
            total: pendingBalance,
          },
        });
      } else {
        const item = providerMap.get(pName)!;
        item.claimCount += 1;
        item.totalClaimAmount += claimAmt;
        item.settledAmount += settledAmt;
        item.pendingBalance += pendingBalance;
        if (!isSettled) {
          if (daysDiff <= 30) item.aging.current += pendingBalance;
          else if (daysDiff <= 60) item.aging.thirtyToOne += pendingBalance;
          else if (daysDiff <= 90) item.aging.sixtyToOne += pendingBalance;
          else item.aging.ninetyPlus += pendingBalance;
          item.aging.total += pendingBalance;
        }
      }
    }

    return {
      status: true,
      message,
      data: {
        overallTotal,
        overallPending,
        overallSettled,
        overallAging,
        providers: Array.from(providerMap.values()),
        claims,
      },
    };
  } catch (error) {
    console.error("getHmoArSummaryAction error:", error);
    message = "Error fetching HMO AR summary";
    if (error instanceof Error) message = error.message;
    return {
      status: false,
      message,
      data: {
        overallTotal: 0,
        overallPending: 0,
        overallSettled: 0,
        overallAging: { current: 0, thirtyToOne: 0, sixtyToOne: 0, ninetyPlus: 0, total: 0 },
        providers: [],
        claims: [],
      },
    };
  }
};

export const updateHmoClaimStatusAction = async (claimId: number, status: ArClaimStatus) => {
  let message = "HMO claim status updated";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const updated = await prisma.hmoClaimRecord.update({
      where: { id: claimId },
      data: {
        status,
        ...(status === "SUBMITTED" && { submittedAt: new Date() }),
      },
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("updateHmoClaimStatusAction error:", error);
    message = "Error updating HMO claim status";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export type SettleHmoClaimInput = {
  claimId: number;
  settledAmount: number;
  deductionAmount?: number;
  checkNumber?: string;
};

export const settleHmoClaimAction = async (input: SettleHmoClaimInput) => {
  let message = "HMO claim payment settled successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const claim = await prisma.hmoClaimRecord.findUnique({
      where: { id: input.claimId },
      include: { Invoice: true },
    });
    if (!claim) throw new Error("HMO claim record not found");

    const deduction = Number(input.deductionAmount ?? 0);
    const settled = Number(input.settledAmount);

    const updated = await prisma.$transaction(async (tx) => {
      const claimRecord = await tx.hmoClaimRecord.update({
        where: { id: input.claimId },
        data: {
          status: "PAID",
          settledAt: new Date(),
          settledAmount: settled,
          deductionAmount: deduction,
          checkNumber: input.checkNumber?.trim() || null,
        },
      });

      // Update invoice amountPaid and balanceDue
      const inv = claim.Invoice;
      const newPaid = Number(inv.amountPaid) + settled;
      const newBalance = Math.max(0, Number(inv.totalAmount) - newPaid - deduction);

      await tx.invoice.update({
        where: { id: inv.id },
        data: {
          amountPaid: newPaid,
          balanceDue: newBalance,
          status: newBalance <= 0 ? "PAID" : "PARTIALLY_PAID",
        },
      });

      return claimRecord;
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("settleHmoClaimAction error:", error);
    message = "Error settling HMO claim";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};
