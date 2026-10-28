"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import type { PaymentMethod } from "@prisma/client";

export type ProcessPaymentInput = {
  invoiceId: number;
  paymentMethod: PaymentMethod;
  amount: number;
  tenderedAmount?: number;
  changeAmount?: number;
  referenceNumber?: string;
  hmoProvider?: string;
  hmoApprovalCode?: string;
};

export const processPaymentAction = async (input: ProcessPaymentInput) => {
  let message = "Payment recorded and Official Receipt issued";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const dbUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true },
    });
    if (!dbUser) throw new Error("User record not found");

    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        Clinic: {
          include: { ClinicBillingSetting: true },
        },
      },
    });

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "VOID" || invoice.status === "CANCELLED") {
      throw new Error(`Cannot process payment on invoice with status ${invoice.status}`);
    }

    const currentBalance = Number(invoice.balanceDue);
    if (input.amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }
    if (input.amount > currentBalance + 0.01) {
      throw new Error(
        `Payment amount (₱${input.amount.toFixed(2)}) cannot exceed balance due (₱${currentBalance.toFixed(2)})`
      );
    }

    const clinic = invoice.Clinic;
    const prefix = clinic.ClinicBillingSetting?.receiptPrefix ?? "OR-";
    const nextNum = clinic.ClinicBillingSetting?.nextReceiptNumber ?? 1;
    const yearStr = new Date().getFullYear();
    const receiptNumber = `${prefix}${yearStr}-${String(nextNum).padStart(4, "0")}`;

    // Find active cashier shift for this user if any
    const activeShift = await prisma.cashierShift.findFirst({
      where: {
        clinicId: clinic.id,
        cashierUserId: dbUser.id,
        status: "OPEN",
      },
    });

    const newAmountPaid = Number(invoice.amountPaid) + Number(input.amount);
    const newBalanceDue = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? "PAID" : "PARTIALLY_PAID";

    const [receipt] = await prisma.$transaction([
      prisma.paymentReceipt.create({
        data: {
          clinicId: clinic.id,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          cashierUserId: dbUser.id,
          receiptNumber,
          paymentMethod: input.paymentMethod,
          amount: input.amount,
          tenderedAmount: input.tenderedAmount ?? input.amount,
          changeAmount: input.changeAmount ?? 0,
          referenceNumber: input.referenceNumber?.trim() || null,
          shiftId: activeShift?.id ?? null,
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus,
          ...(input.hmoProvider && { hmoProviderName: input.hmoProvider.trim() }),
          ...(input.hmoApprovalCode && { hmoApprovalCode: input.hmoApprovalCode.trim() }),
        },
      }),
      prisma.clinicBillingSetting.upsert({
        where: { clinicId: clinic.id },
        create: {
          clinicId: clinic.id,
          nextReceiptNumber: nextNum + 1,
        },
        update: {
          nextReceiptNumber: { increment: 1 },
        },
      }),
      ...(input.paymentMethod === "HMO_RECEIVABLE" || input.hmoApprovalCode
        ? [
            prisma.hmoClaimRecord.upsert({
              where: { invoiceId: invoice.id },
              create: {
                clinicId: clinic.id,
                invoiceId: invoice.id,
                hmoProvider: input.hmoProvider?.trim() || "HMO Provider",
                approvalCode: input.hmoApprovalCode?.trim() || "N/A",
                claimAmount: input.amount,
                status: "PENDING_SUBMISSION",
              },
              update: {
                claimAmount: input.amount,
                hmoProvider: input.hmoProvider?.trim() || "HMO Provider",
                approvalCode: input.hmoApprovalCode?.trim() || "N/A",
              },
            }),
          ]
        : []),
    ]);

    return { status: true, message, data: receipt };
  } catch (error) {
    console.error("processPaymentAction error:", error);
    message = "Error processing payment";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const getPaymentReceiptDetailAction = cache(async (receiptId: number) => {
  let message = "Receipt details fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: {
        Clinic: {
          include: { ClinicBillingSetting: true },
        },
        Invoice: {
          include: {
            Items: true,
          },
        },
        ClinicPatient: {
          include: {
            Patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                mobile: true,
                email: true,
              },
            },
          },
        },
        Cashier: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!receipt) throw new Error("Receipt not found");

    return { status: true, message, data: receipt };
  } catch (error) {
    console.error("getPaymentReceiptDetailAction error:", error);
    message = "Error fetching receipt details";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
});
