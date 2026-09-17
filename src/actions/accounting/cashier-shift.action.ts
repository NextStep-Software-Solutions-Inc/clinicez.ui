"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export const getCurrentShiftAction = async (clinicUid: string) => {
  let message = "Current shift fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const dbUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!dbUser) throw new Error("User not found");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const activeShift = await prisma.cashierShift.findFirst({
      where: {
        clinicId: clinic.id,
        cashierUserId: dbUser.id,
        status: "OPEN",
      },
      include: {
        Cashier: {
          select: { firstName: true, lastName: true },
        },
        Payments: {
          where: { isVoided: false },
          select: {
            amount: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    if (!activeShift) {
      return { status: true, message: "No active shift", data: null };
    }

    // Compute live collections by tender
    let cashCollections = 0;
    let gcashCollections = 0;
    let mayaCollections = 0;
    let cardCollections = 0;
    let otherCollections = 0;

    for (const p of activeShift.Payments) {
      const amt = Number(p.amount);
      if (p.paymentMethod === "CASH") cashCollections += amt;
      else if (p.paymentMethod === "GCASH") gcashCollections += amt;
      else if (p.paymentMethod === "MAYA") mayaCollections += amt;
      else if (p.paymentMethod === "CREDIT_CARD" || p.paymentMethod === "DEBIT_CARD")
        cardCollections += amt;
      else otherCollections += amt;
    }

    const openingFloat = Number(activeShift.openingFloat);
    const expectedCashInDrawer = openingFloat + cashCollections;
    const totalSales =
      cashCollections + gcashCollections + mayaCollections + cardCollections + otherCollections;

    return {
      status: true,
      message,
      data: {
        ...activeShift,
        openingFloat,
        cashCollections,
        gcashCollections,
        mayaCollections,
        cardCollections,
        otherCollections,
        expectedCashInDrawer,
        totalSales,
        paymentCount: activeShift.Payments.length,
      },
    };
  } catch (error) {
    console.error("getCurrentShiftAction error:", error);
    message = "Error fetching current shift";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const openCashierShiftAction = async (
  clinicUid: string,
  openingFloat: number,
  notes?: string
) => {
  let message = "Cashier shift opened successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const dbUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true },
    });
    if (!dbUser) throw new Error("User not found");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    if (openingFloat < 0 || isNaN(openingFloat)) {
      throw new Error("Opening float must be a non-negative number.");
    }

    // Check if an open shift already exists for this cashier
    const existing = await prisma.cashierShift.findFirst({
      where: {
        clinicId: clinic.id,
        cashierUserId: dbUser.id,
        status: "OPEN",
      },
    });

    if (existing) {
      throw new Error("You already have an active open shift. Please close it first.");
    }

    const shift = await prisma.cashierShift.create({
      data: {
        clinicId: clinic.id,
        cashierUserId: dbUser.id,
        openingFloat,
        notes: notes?.trim() || null,
        status: "OPEN",
      },
    });

    return { status: true, message, data: shift };
  } catch (error) {
    console.error("openCashierShiftAction error:", error);
    message = "Error opening cashier shift";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const closeCashierShiftAction = async (
  shiftId: number,
  actualCash: number,
  notes?: string
) => {
  let message = "Cashier shift reconciled and closed successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const shift = await prisma.cashierShift.findUnique({
      where: { id: shiftId },
      include: {
        Payments: {
          where: { isVoided: false, paymentMethod: "CASH" },
          select: { amount: true },
        },
      },
    });

    if (!shift) throw new Error("Shift not found");
    if (shift.status === "CLOSED") throw new Error("This shift is already closed.");

    const openingFloat = Number(shift.openingFloat);
    const cashSales = shift.Payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expectedCash = openingFloat + cashSales;
    const cashVariance = actualCash - expectedCash; // positive = overage, negative = shortage

    const updated = await prisma.cashierShift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        expectedCash,
        actualCash,
        cashVariance,
        notes: notes?.trim() || shift.notes,
      },
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("closeCashierShiftAction error:", error);
    message = "Error closing shift";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const getShiftHistoryAction = async (clinicUid: string, limit = 20) => {
  let message = "Shift history fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const shifts = await prisma.cashierShift.findMany({
      where: { clinicId: clinic.id },
      include: {
        Cashier: {
          select: { firstName: true, lastName: true },
        },
        _count: { select: { Payments: true } },
      },
      orderBy: { openedAt: "desc" },
      take: limit,
    });

    return { status: true, message, data: shifts };
  } catch (error) {
    console.error("getShiftHistoryAction error:", error);
    message = "Error fetching shift history";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: [] };
  }
};
