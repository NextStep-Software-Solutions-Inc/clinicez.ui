"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import {
  generateBirSalesBookCsv,
  generateBirCashReceiptsBookCsv,
  generateGeneralJournalCsv,
  type ClinicMeta,
} from "@/lib/accounting/bir-export";

/**
 * Fetch BIR Sales Book CSV
 */
export const getBirSalesBookAction = async (
  clinicUid: string,
  startDate?: string,
  endDate?: string
) => {
  let message = "BIR Sales Book generated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      include: { ClinicBillingSetting: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1); // 1st day of current month
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of month

    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : defaultEnd;

    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId: clinic.id,
        issuedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        ClinicPatient: {
          include: {
            Patient: {
              select: { firstName: true, lastName: true, middleName: true },
            },
          },
        },
      },
      orderBy: { issuedAt: "asc" },
    });

    const meta: ClinicMeta = {
      businessName: clinic.ClinicBillingSetting?.registeredBusinessName || clinic.name,
      tin: clinic.ClinicBillingSetting?.tinNumber || undefined,
      birPermit: clinic.ClinicBillingSetting?.birPermitNumber || undefined,
      isVatRegistered: clinic.ClinicBillingSetting?.isVatRegistered ?? true,
    };

    const dateRange = {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };

    const csvString = generateBirSalesBookCsv(invoices, meta, dateRange);
    const filename = `BIR_Sales_Book_${clinicUid}_${dateRange.start}_to_${dateRange.end}.csv`;

    return {
      status: true,
      message,
      data: {
        csvString,
        filename,
        invoiceCount: invoices.length,
        dateRange,
      },
    };
  } catch (error) {
    console.error("getBirSalesBookAction error:", error);
    message = "Error generating BIR Sales Book";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

/**
 * Fetch BIR Cash Receipts Book CSV
 */
export const getBirCashReceiptsBookAction = async (
  clinicUid: string,
  startDate?: string,
  endDate?: string
) => {
  let message = "BIR Cash Receipts Book generated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      include: { ClinicBillingSetting: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : defaultEnd;

    const receipts = await prisma.paymentReceipt.findMany({
      where: {
        clinicId: clinic.id,
        paidAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        Invoice: { select: { invoiceNumber: true } },
        ClinicPatient: {
          include: {
            Patient: { select: { firstName: true, lastName: true } },
          },
        },
        Cashier: { select: { firstName: true, lastName: true } },
      },
      orderBy: { paidAt: "asc" },
    });

    const meta: ClinicMeta = {
      businessName: clinic.ClinicBillingSetting?.registeredBusinessName || clinic.name,
      tin: clinic.ClinicBillingSetting?.tinNumber || undefined,
      birPermit: clinic.ClinicBillingSetting?.birPermitNumber || undefined,
      isVatRegistered: clinic.ClinicBillingSetting?.isVatRegistered ?? true,
    };

    const dateRange = {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };

    const csvString = generateBirCashReceiptsBookCsv(receipts, meta, dateRange);
    const filename = `BIR_Cash_Receipts_Book_${clinicUid}_${dateRange.start}_to_${dateRange.end}.csv`;

    return {
      status: true,
      message,
      data: {
        csvString,
        filename,
        receiptCount: receipts.length,
        dateRange,
      },
    };
  } catch (error) {
    console.error("getBirCashReceiptsBookAction error:", error);
    message = "Error generating BIR Cash Receipts Book";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

/**
 * Fetch External General Ledger Journal CSV (Xero / QuickBooks / Generic)
 */
export const getGeneralJournalExportAction = async (
  clinicUid: string,
  format: "XERO" | "QUICKBOOKS" | "GENERIC",
  startDate?: string,
  endDate?: string
) => {
  let message = `General Journal CSV (${format}) generated successfully`;

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      include: {
        ClinicBillingSetting: true,
        ChartOfAccounts: true,
      },
    });
    if (!clinic) throw new Error("Clinic not found");

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : defaultEnd;

    // Fetch Invoices, Receipts, and Paid Vouchers
    const [invoices, receipts, vouchers] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          clinicId: clinic.id,
          issuedAt: { gte: start, lte: end },
        },
        include: {
          Items: true,
          ClinicPatient: {
            include: {
              Patient: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { issuedAt: "asc" },
      }),
      prisma.paymentReceipt.findMany({
        where: {
          clinicId: clinic.id,
          paidAt: { gte: start, lte: end },
        },
        orderBy: { paidAt: "asc" },
      }),
      prisma.doctorPayoutVoucher.findMany({
        where: {
          clinicId: clinic.id,
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        include: {
          Doctor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { paidAt: "asc" },
      }),
    ]);

    const meta: ClinicMeta = {
      businessName: clinic.ClinicBillingSetting?.registeredBusinessName || clinic.name,
      tin: clinic.ClinicBillingSetting?.tinNumber || undefined,
      birPermit: clinic.ClinicBillingSetting?.birPermitNumber || undefined,
      isVatRegistered: clinic.ClinicBillingSetting?.isVatRegistered ?? true,
    };

    const dateRange = {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };

    const csvString = generateGeneralJournalCsv(
      {
        invoices,
        receipts,
        vouchers,
        coa: clinic.ChartOfAccounts,
      },
      format,
      meta,
      dateRange
    );

    const filename = `${format}_Journal_Entries_${clinicUid}_${dateRange.start}_to_${dateRange.end}.csv`;

    return {
      status: true,
      message,
      data: {
        csvString,
        filename,
        format,
        invoicesCount: invoices.length,
        vouchersCount: vouchers.length,
        dateRange,
      },
    };
  } catch (error) {
    console.error("getGeneralJournalExportAction error:", error);
    message = "Error generating General Journal CSV";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

/**
 * Fetch Clinic Chart of Accounts
 */
export const getClinicChartOfAccountsAction = cache(async (clinicUid: string) => {
  let message = "Chart of Accounts fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    // Upsert default COA mapping if none exists yet
    const coa = await prisma.clinicChartOfAccounts.upsert({
      where: { clinicId: clinic.id },
      create: { clinicId: clinic.id },
      update: {},
    });

    return { status: true, message, data: coa };
  } catch (error) {
    console.error("getClinicChartOfAccountsAction error:", error);
    message = "Error fetching Chart of Accounts";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
});

export type UpdateChartOfAccountsInput = {
  cashAccountCode?: string;
  eWalletAccountCode?: string;
  bankAccountCode?: string;
  hmoReceivableAccountCode?: string;
  consultationRevenueCode?: string;
  labRevenueCode?: string;
  imagingRevenueCode?: string;
  pharmacyRevenueCode?: string;
  vatPayableAccountCode?: string;
  doctorPfPayableCode?: string;
  withholdingTaxCode?: string;
  accountingPlatform?: string;
};

/**
 * Update Clinic Chart of Accounts mapping
 */
export const updateClinicChartOfAccountsAction = async (
  clinicUid: string,
  input: UpdateChartOfAccountsInput
) => {
  let message = "Chart of Accounts updated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const updated = await prisma.clinicChartOfAccounts.upsert({
      where: { clinicId: clinic.id },
      create: {
        clinicId: clinic.id,
        ...input,
      },
      update: input,
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("updateClinicChartOfAccountsAction error:", error);
    message = "Error updating Chart of Accounts";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};
