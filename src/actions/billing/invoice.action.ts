"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { calculateBillTotals } from "@/lib/billing/tax-engine";
import type { DiscountType, InvoiceStatus, PriceCategory } from "@prisma/client";

export type PendingEncounter = {
  consultationTicketId: number;
  patientId: number;
  patientName: string;
  caseNumber: string | null;
  doctorName: string;
  doctorId: number | null;
  date: Date;
  serviceSummary: string;
  existingInvoiceId: number | null;
};

export const getPendingBillingEncountersAction = async (clinicUid: string) => {
  let message = "Pending billing encounters fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    // Fetch consultations from the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const consultations = await prisma.consultationTicket.findMany({
      where: {
        clinicId: clinic.id,
        createdAt: { gte: sevenDaysAgo },
        isActive: true,
      },
      include: {
        ClinicPatient: {
          include: {
            Patient: {
              select: { id: true, firstName: true, lastName: true, middleName: true },
            },
          },
        },
        ConsultationTicketHPs: {
          include: {
            HealthCareProvider: {
              include: {
                User: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
        LaboratoryRequests: { select: { id: true } },
        ImagingRequests: { select: { id: true } },
        HeartStationRequests: { select: { id: true } },
        Invoices: {
          select: { id: true, status: true, invoiceNumber: true, totalAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Filter consultations that don't have a PAID invoice yet
    const pending: PendingEncounter[] = [];

    for (const c of consultations) {
      const activeInvoice = c.Invoices.find(
        (inv) => inv.status !== "VOID" && inv.status !== "CANCELLED"
      );

      // If already fully paid, skip
      if (activeInvoice && activeInvoice.status === "PAID") continue;

      const patientUser = c.ClinicPatient?.Patient;
      const patientName = patientUser
        ? `${patientUser.lastName}, ${patientUser.firstName}`
        : "Unknown Patient";

      const hpUser = c.ConsultationTicketHPs?.[0]?.HealthCareProvider?.User;
      const doctorName = hpUser ? `Dr. ${hpUser.firstName} ${hpUser.lastName}` : "Attending Doctor";
      const doctorId = hpUser?.id ?? null;

      const services: string[] = ["Consultation"];
      if (c.LaboratoryRequests.length > 0)
        services.push(`${c.LaboratoryRequests.length} Lab Test(s)`);
      if (c.ImagingRequests.length > 0)
        services.push(`${c.ImagingRequests.length} Imaging`);
      if (c.HeartStationRequests.length > 0)
        services.push(`${c.HeartStationRequests.length} ECG/Heart`);

      pending.push({
        consultationTicketId: c.id,
        patientId: c.clinicPatientId ?? 0,
        patientName,
        caseNumber: c.caseNumber,
        doctorName,
        doctorId,
        date: c.createdAt,
        serviceSummary: services.join(" • "),
        existingInvoiceId: activeInvoice ? activeInvoice.id : null,
      });
    }

    return { status: true, message, data: pending };
  } catch (error) {
    console.error("getPendingBillingEncountersAction error:", error);
    message = "Error fetching pending encounters";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: [] };
  }
};

export const createDraftInvoiceFromEncounterAction = async (
  clinicUid: string,
  consultationTicketId: number
) => {
  let message = "Draft invoice created successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const dbUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true },
    });
    if (!dbUser) throw new Error("User record not found");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      include: {
        ClinicBillingSetting: true,
        ClinicPriceItems: { where: { isActive: true } },
      },
    });
    if (!clinic) throw new Error("Clinic not found");

    const consultation = await prisma.consultationTicket.findUnique({
      where: { id: consultationTicketId },
      include: {
        ClinicPatient: true,
        ConsultationTicketHPs: {
          include: {
            HealthCareProvider: {
              include: { User: true },
            },
          },
        },
        LaboratoryRequests: {
          include: {
            LaboratoryRequestProcedures: {
              include: { LaboratoryProcedure: true },
            },
          },
        },
        ImagingRequests: {
          include: {
            ImagingRequestProcedures: {
              include: { ImagingProcedure: true },
            },
          },
        },
        HeartStationRequests: {
          include: {
            HeartStationRequestProcedures: {
              include: { HeartStationProcedure: true },
            },
          },
        },
        Invoices: {
          where: { status: { notIn: ["VOID", "CANCELLED"] } },
        },
      },
    });

    if (!consultation || !consultation.clinicPatientId) {
      throw new Error("Consultation ticket or patient not found");
    }

    // If an unpaid/draft invoice already exists for this encounter, return it
    if (consultation.Invoices.length > 0) {
      return { status: true, message: "Loaded existing invoice", data: consultation.Invoices[0] };
    }

    const doctorUser = consultation.ConsultationTicketHPs?.[0]?.HealthCareProvider?.User;
    const doctorId = doctorUser?.id ?? null;

    // Generate line items based on encounter contents
    const itemsToCreate: Array<{
      description: string;
      category: PriceCategory;
      quantity: number;
      unitPrice: number;
      isVatable: boolean;
      doctorId?: number | null;
      doctorSharePercent?: number | null;
      priceItemId?: number | null;
    }> = [];

    // 1. Consultation Fee
    const consultPriceItem = clinic.ClinicPriceItems.find(
      (p) => p.category === "CONSULTATION"
    );
    const consultPrice = consultPriceItem ? Number(consultPriceItem.unitPrice) : 500;
    const consultDoctorShare = consultPriceItem?.defaultDoctorSharePercent
      ? Number(consultPriceItem.defaultDoctorSharePercent)
      : 70;

    itemsToCreate.push({
      description: consultPriceItem?.name ?? "General Medical Consultation",
      category: "CONSULTATION",
      quantity: 1,
      unitPrice: consultPrice,
      isVatable: consultPriceItem ? consultPriceItem.isVatable : true,
      doctorId,
      doctorSharePercent: consultDoctorShare,
      priceItemId: consultPriceItem?.id ?? null,
    });

    // 2. Laboratory Procedures
    for (const labReq of consultation.LaboratoryRequests) {
      for (const proc of labReq.LaboratoryRequestProcedures) {
        const procName = proc.LaboratoryProcedure.name;
        const matchingPrice = clinic.ClinicPriceItems.find(
          (p) =>
            p.category === "LABORATORY" &&
            p.name.toLowerCase().includes(procName.toLowerCase())
        );

        itemsToCreate.push({
          description: `Lab: ${procName}`,
          category: "LABORATORY",
          quantity: 1,
          unitPrice: matchingPrice ? Number(matchingPrice.unitPrice) : 250,
          isVatable: matchingPrice ? matchingPrice.isVatable : true,
          priceItemId: matchingPrice?.id ?? null,
        });
      }
    }

    // 3. Imaging Procedures
    for (const imgReq of consultation.ImagingRequests) {
      for (const proc of imgReq.ImagingRequestProcedures) {
        const procName = proc.ImagingProcedure.name;
        const matchingPrice = clinic.ClinicPriceItems.find(
          (p) =>
            p.category === "IMAGING" &&
            p.name.toLowerCase().includes(procName.toLowerCase())
        );

        itemsToCreate.push({
          description: `Imaging: ${procName}`,
          category: "IMAGING",
          quantity: 1,
          unitPrice: matchingPrice ? Number(matchingPrice.unitPrice) : 400,
          isVatable: matchingPrice ? matchingPrice.isVatable : true,
          priceItemId: matchingPrice?.id ?? null,
        });
      }
    }

    // 4. Heart Station Procedures (ECG)
    for (const hsReq of consultation.HeartStationRequests) {
      for (const proc of hsReq.HeartStationRequestProcedures) {
        const procName = proc.HeartStationProcedure.name;
        const matchingPrice = clinic.ClinicPriceItems.find(
          (p) =>
            p.category === "HEART_STATION" &&
            p.name.toLowerCase().includes(procName.toLowerCase())
        );

        itemsToCreate.push({
          description: `Heart Station: ${procName}`,
          category: "HEART_STATION",
          quantity: 1,
          unitPrice: matchingPrice ? Number(matchingPrice.unitPrice) : 350,
          isVatable: matchingPrice ? matchingPrice.isVatable : true,
          priceItemId: matchingPrice?.id ?? null,
        });
      }
    }

    // Calculate totals
    const calc = calculateBillTotals(itemsToCreate, "NONE");

    // Generate next invoice number atomically
    const prefix = clinic.ClinicBillingSetting?.invoicePrefix ?? "INV-";
    const nextNum = clinic.ClinicBillingSetting?.nextInvoiceNumber ?? 1;
    const yearStr = new Date().getFullYear();
    const invoiceNumber = `${prefix}${yearStr}-${String(nextNum).padStart(4, "0")}`;

    // Create Invoice & increment sequence
    const [newInvoice] = await prisma.$transaction([
      prisma.invoice.create({
        data: {
          clinicId: clinic.id,
          patientId: consultation.clinicPatientId,
          consultationTicketId: consultation.id,
          appointmentId: consultation.appointmentId,
          invoiceNumber,
          status: "UNPAID",
          subtotal: calc.rawSubtotal,
          vatableSales: calc.vatableSales,
          vatExemptSales: calc.vatExemptSales,
          vatAmount: calc.vatAmount,
          discountType: "NONE",
          discountAmount: 0,
          totalAmount: calc.totalAmount,
          balanceDue: calc.totalAmount,
          createdByUserId: dbUser.id,
          Items: {
            create: itemsToCreate.map((item) => {
              const totalPrice = item.unitPrice * item.quantity;
              const doctorShareAmount =
                item.doctorSharePercent && item.doctorId
                  ? (totalPrice * item.doctorSharePercent) / 100
                  : null;

              return {
                description: item.description,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice,
                isVatable: item.isVatable,
                doctorId: item.doctorId ?? null,
                doctorSharePercent: item.doctorSharePercent ?? null,
                doctorShareAmount,
                priceItemId: item.priceItemId ?? null,
              };
            }),
          },
        },
        include: { Items: true },
      }),
      prisma.clinicBillingSetting.upsert({
        where: { clinicId: clinic.id },
        create: {
          clinicId: clinic.id,
          nextInvoiceNumber: nextNum + 1,
        },
        update: {
          nextInvoiceNumber: { increment: 1 },
        },
      }),
    ]);

    return { status: true, message, data: newInvoice };
  } catch (error) {
    console.error("createDraftInvoiceFromEncounterAction error:", error);
    message = "Error creating draft invoice";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export type DirectInvoiceItemInput = {
  description: string;
  category?: PriceCategory;
  quantity: number;
  unitPrice: number;
  isVatable?: boolean;
  doctorId?: number | null;
  doctorSharePercent?: number | null;
  priceItemId?: number | null;
};

export type CreateDirectInvoiceInput = {
  clinicUid: string;
  patientId: number;
  consultationTicketId?: number;
  items: DirectInvoiceItemInput[];
  discountType?: DiscountType;
  discountIdNumber?: string;
  notes?: string;
};

export const createDirectInvoiceAction = async (input: CreateDirectInvoiceInput) => {
  let message = "Invoice generated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const dbUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true },
    });
    if (!dbUser) throw new Error("User record not found");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid: input.clinicUid },
      include: { ClinicBillingSetting: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    if (!input.items || input.items.length === 0) {
      throw new Error("At least one line item is required.");
    }

    const discountType = input.discountType ?? "NONE";
    const calc = calculateBillTotals(input.items, discountType);

    const prefix = clinic.ClinicBillingSetting?.invoicePrefix ?? "INV-";
    const nextNum = clinic.ClinicBillingSetting?.nextInvoiceNumber ?? 1;
    const yearStr = new Date().getFullYear();
    const invoiceNumber = `${prefix}${yearStr}-${String(nextNum).padStart(4, "0")}`;

    const [newInvoice] = await prisma.$transaction([
      prisma.invoice.create({
        data: {
          clinicId: clinic.id,
          patientId: input.patientId,
          consultationTicketId: input.consultationTicketId ?? null,
          invoiceNumber,
          status: "UNPAID",
          subtotal: calc.rawSubtotal,
          vatableSales: calc.vatableSales,
          vatExemptSales: calc.vatExemptSales,
          vatAmount: calc.vatAmount,
          discountType,
          discountIdNumber: input.discountIdNumber?.trim() || null,
          discountRatePercent: calc.discountRatePercent,
          discountAmount: calc.discountAmount,
          totalAmount: calc.totalAmount,
          balanceDue: calc.totalAmount,
          notes: input.notes?.trim() || null,
          createdByUserId: dbUser.id,
          Items: {
            create: input.items.map((item) => {
              const totalPrice = item.unitPrice * item.quantity;
              const doctorShareAmount =
                item.doctorSharePercent && item.doctorId
                  ? (totalPrice * item.doctorSharePercent) / 100
                  : null;

              return {
                description: item.description,
                category: item.category ?? "OTHER",
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice,
                isVatable: item.isVatable ?? true,
                doctorId: item.doctorId ?? null,
                doctorSharePercent: item.doctorSharePercent ?? null,
                doctorShareAmount,
                priceItemId: item.priceItemId ?? null,
              };
            }),
          },
        },
        include: { Items: true },
      }),
      prisma.clinicBillingSetting.upsert({
        where: { clinicId: clinic.id },
        create: {
          clinicId: clinic.id,
          nextInvoiceNumber: nextNum + 1,
        },
        update: {
          nextInvoiceNumber: { increment: 1 },
        },
      }),
    ]);

    return { status: true, message, data: newInvoice };
  } catch (error) {
    console.error("createDirectInvoiceAction error:", error);
    message = "Error generating invoice";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export type UpdateInvoiceItemsInput = {
  invoiceId: number;
  items: DirectInvoiceItemInput[];
  discountType?: DiscountType;
  discountIdNumber?: string;
  notes?: string;
};

export const updateInvoiceItemsAction = async (input: UpdateInvoiceItemsInput) => {
  let message = "Invoice updated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { Payments: true },
    });
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "PAID" || invoice.status === "VOID") {
      throw new Error(`Cannot modify invoice with status ${invoice.status}`);
    }

    const discountType = input.discountType ?? invoice.discountType;
    const calc = calculateBillTotals(input.items, discountType);

    const paid = Number(invoice.amountPaid);
    const newBalance = Math.max(0, calc.totalAmount - paid);
    const newStatus: InvoiceStatus =
      newBalance === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old line items and recreate
      await tx.invoiceItem.deleteMany({ where: { invoiceId: input.invoiceId } });

      return tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          subtotal: calc.rawSubtotal,
          vatableSales: calc.vatableSales,
          vatExemptSales: calc.vatExemptSales,
          vatAmount: calc.vatAmount,
          discountType,
          discountIdNumber: input.discountIdNumber?.trim() || invoice.discountIdNumber,
          discountRatePercent: calc.discountRatePercent,
          discountAmount: calc.discountAmount,
          totalAmount: calc.totalAmount,
          balanceDue: newBalance,
          status: newStatus,
          notes: input.notes !== undefined ? input.notes : invoice.notes,
          Items: {
            create: input.items.map((item) => {
              const totalPrice = item.unitPrice * item.quantity;
              const doctorShareAmount =
                item.doctorSharePercent && item.doctorId
                  ? (totalPrice * item.doctorSharePercent) / 100
                  : null;

              return {
                description: item.description,
                category: item.category ?? "OTHER",
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice,
                isVatable: item.isVatable ?? true,
                doctorId: item.doctorId ?? null,
                doctorSharePercent: item.doctorSharePercent ?? null,
                doctorShareAmount,
                priceItemId: item.priceItemId ?? null,
              };
            }),
          },
        },
        include: { Items: true, Payments: true },
      });
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("updateInvoiceItemsAction error:", error);
    message = "Error updating invoice items";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const getInvoiceDetailAction = cache(async (invoiceId: number) => {
  let message = "Invoice details fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        Clinic: {
          include: { ClinicBillingSetting: true },
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
        Items: {
          include: {
            Doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        Payments: {
          include: {
            Cashier: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!invoice) throw new Error("Invoice not found");

    return { status: true, message, data: invoice };
  } catch (error) {
    console.error("getInvoiceDetailAction error:", error);
    message = "Error fetching invoice details";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
});

export type InvoiceFilters = {
  status?: InvoiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export const getInvoicesAction = async (clinicUid: string, filters?: InvoiceFilters) => {
  let message = "Invoices fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const whereClause: any = {
      clinicId: clinic.id,
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      whereClause.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        {
          ClinicPatient: {
            User: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.issuedAt = {};
      if (filters.startDate) whereClause.issuedAt.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.issuedAt.lte = new Date(filters.endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        ClinicPatient: {
          include: {
            Patient: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        Payments: {
          select: { id: true, receiptNumber: true, amount: true, paidAt: true },
        },
        _count: { select: { Items: true } },
      },
      orderBy: { issuedAt: "desc" },
      take: filters?.limit ?? 50,
    });

    return { status: true, message, data: invoices };
  } catch (error) {
    console.error("getInvoicesAction error:", error);
    message = "Error fetching invoices";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: [] };
  }
};

export const voidInvoiceAction = async (invoiceId: number, voidReason: string) => {
  let message = "Invoice voided successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map((p) => p.name);
    const canVoid =
      myPermissionArray.includes(PERMISSIONS.CLINIC["VOID:CLINIC:INVOICE"].name) ||
      myPermissionArray.includes(PERMISSIONS.CLINIC["MANAGE:CLINIC:BILLING"].name);

    if (!canVoid) {
      throw new Error("You do not have permission to void invoices.");
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "VOID",
        voidedAt: new Date(),
        voidReason: voidReason.trim(),
      },
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("voidInvoiceAction error:", error);
    message = "Error voiding invoice";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};
