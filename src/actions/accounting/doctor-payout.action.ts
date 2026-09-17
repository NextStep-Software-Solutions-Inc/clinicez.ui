"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export type UnliquidatedDoctorSummary = {
  doctorId: number;
  doctorName: string;
  itemCount: number;
  grossServiceAmount: number;
  grossPfAmount: number;
  oldestDate: Date;
  newestDate: Date;
};

export const getUnliquidatedDoctorFeesAction = async (clinicUid: string, doctorId?: number) => {
  let message = "Unliquidated doctor fees fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    // Fetch items with a designated doctor and doctorShareAmount > 0
    // that belong to non-void invoices and have not yet been linked to any DoctorPayoutItem
    const whereClause: any = {
      Invoice: {
        clinicId: clinic.id,
        status: { in: ["PAID", "PARTIALLY_PAID"] },
      },
      doctorId: doctorId ? doctorId : { not: null },
      doctorShareAmount: { gt: 0 },
      DoctorPayoutItem: null, // Not yet liquidated
    };

    const items = await prisma.invoiceItem.findMany({
      where: whereClause,
      include: {
        Doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
        Invoice: {
          select: { id: true, invoiceNumber: true, issuedAt: true },
        },
      },
      orderBy: { Invoice: { issuedAt: "asc" } },
    });

    // Group items by doctor
    const doctorMap = new Map<number, UnliquidatedDoctorSummary>();

    for (const item of items) {
      if (!item.Doctor) continue;
      const docId = item.Doctor.id;
      const docName = `Dr. ${item.Doctor.firstName} ${item.Doctor.lastName}`;
      const itemPrice = Number(item.totalPrice);
      const pfShare = Number(item.doctorShareAmount);
      const invDate = item.Invoice.issuedAt;

      if (!doctorMap.has(docId)) {
        doctorMap.set(docId, {
          doctorId: docId,
          doctorName: docName,
          itemCount: 1,
          grossServiceAmount: itemPrice,
          grossPfAmount: pfShare,
          oldestDate: invDate,
          newestDate: invDate,
        });
      } else {
        const existing = doctorMap.get(docId)!;
        existing.itemCount += 1;
        existing.grossServiceAmount += itemPrice;
        existing.grossPfAmount += pfShare;
        if (invDate < existing.oldestDate) existing.oldestDate = invDate;
        if (invDate > existing.newestDate) existing.newestDate = invDate;
      }
    }

    return {
      status: true,
      message,
      data: {
        summaries: Array.from(doctorMap.values()),
        totalUnliquidatedPf: items.reduce((sum, i) => sum + Number(i.doctorShareAmount), 0),
        unliquidatedItems: items,
      },
    };
  } catch (error) {
    console.error("getUnliquidatedDoctorFeesAction error:", error);
    message = "Error fetching unliquidated doctor fees";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: { summaries: [], totalUnliquidatedPf: 0, unliquidatedItems: [] } };
  }
};

export type GenerateDoctorVoucherInput = {
  clinicUid: string;
  doctorId: number;
  withholdingTaxRate?: number; // e.g. 10%
  facilityFeeDeduction?: number;
  periodStart?: string;
  periodEnd?: string;
  itemIds?: number[];
};

export const generateDoctorPayoutVoucherAction = async (input: GenerateDoctorVoucherInput) => {
  let message = "Doctor payout voucher generated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid: input.clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    // Fetch unliquidated items for this doctor
    const whereClause: any = {
      Invoice: {
        clinicId: clinic.id,
        status: { in: ["PAID", "PARTIALLY_PAID"] },
      },
      doctorId: input.doctorId,
      doctorShareAmount: { gt: 0 },
      DoctorPayoutItem: null,
    };

    if (input.itemIds && input.itemIds.length > 0) {
      whereClause.id = { in: input.itemIds };
    }

    const items = await prisma.invoiceItem.findMany({
      where: whereClause,
      include: { Invoice: true },
    });

    if (items.length === 0) {
      throw new Error("No unliquidated items found for this doctor.");
    }

    const grossPf = items.reduce((sum, item) => sum + Number(item.doctorShareAmount), 0);
    const facilityFee = Number(input.facilityFeeDeduction ?? 0);
    const taxRate = Number(input.withholdingTaxRate ?? 10.0);
    const taxAmount = (grossPf * taxRate) / 100;
    const netPayout = Math.max(0, grossPf - facilityFee - taxAmount);

    // Generate next voucher number
    const count = await prisma.doctorPayoutVoucher.count({ where: { clinicId: clinic.id } });
    const yearStr = new Date().getFullYear();
    const voucherNumber = `PF-${yearStr}-${String(count + 1).padStart(4, "0")}`;

    const periodStart = input.periodStart ? new Date(input.periodStart) : items[0].Invoice.issuedAt;
    const periodEnd = input.periodEnd ? new Date(input.periodEnd) : new Date();

    const voucher = await prisma.doctorPayoutVoucher.create({
      data: {
        clinicId: clinic.id,
        doctorId: input.doctorId,
        voucherNumber,
        periodStart,
        periodEnd,
        grossPfAmount: grossPf,
        facilityFeeDeduction: facilityFee,
        withholdingTaxRate: taxRate,
        withholdingTaxAmount: taxAmount,
        netPayoutAmount: netPayout,
        status: "UNPAID",
        LineItems: {
          create: items.map((item) => ({
            invoiceItemId: item.id,
            consultationFee: item.totalPrice,
            doctorShare: item.doctorShareAmount ?? item.totalPrice,
          })),
        },
      },
      include: {
        Doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
        LineItems: true,
      },
    });

    return { status: true, message, data: voucher };
  } catch (error) {
    console.error("generateDoctorPayoutVoucherAction error:", error);
    message = "Error generating doctor payout voucher";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const markDoctorVoucherPaidAction = async (
  voucherId: number,
  paymentReference: string
) => {
  let message = "Doctor voucher marked as PAID";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const voucher = await prisma.doctorPayoutVoucher.findUnique({
      where: { id: voucherId },
    });
    if (!voucher) throw new Error("Voucher not found");
    if (voucher.status === "PAID") throw new Error("Voucher is already paid.");

    const updated = await prisma.doctorPayoutVoucher.update({
      where: { id: voucherId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentReference: paymentReference.trim() || null,
      },
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("markDoctorVoucherPaidAction error:", error);
    message = "Error marking voucher as paid";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const getDoctorPayoutVouchersAction = async (clinicUid: string, doctorId?: number) => {
  let message = "Doctor vouchers fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const vouchers = await prisma.doctorPayoutVoucher.findMany({
      where: {
        clinicId: clinic.id,
        ...(doctorId && { doctorId }),
      },
      include: {
        Doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { LineItems: true } },
      },
      orderBy: { generatedAt: "desc" },
    });

    return { status: true, message, data: vouchers };
  } catch (error) {
    console.error("getDoctorPayoutVouchersAction error:", error);
    message = "Error fetching doctor vouchers";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: [] };
  }
};

export const getDoctorVoucherDetailAction = cache(async (voucherId: number) => {
  let message = "Voucher details fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const voucher = await prisma.doctorPayoutVoucher.findUnique({
      where: { id: voucherId },
      include: {
        Clinic: {
          include: { ClinicBillingSetting: true },
        },
        Doctor: {
          select: { id: true, firstName: true, lastName: true, email: true, mobile: true },
        },
        LineItems: {
          include: {
            InvoiceItem: {
              include: {
                Invoice: {
                  include: {
                    ClinicPatient: {
                      include: {
                        Patient: { select: { firstName: true, lastName: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!voucher) throw new Error("Voucher not found");

    return { status: true, message, data: voucher };
  } catch (error) {
    console.error("getDoctorVoucherDetailAction error:", error);
    message = "Error fetching voucher details";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
});
