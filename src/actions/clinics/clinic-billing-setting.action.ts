"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { hasCodeProperty } from "@lib/utils";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import type { ClinicBillingMode } from "@prisma/client";

export type GetClinicBillingSetting = Awaited<ReturnType<typeof getClinicBillingSettingAction>>;

export const getClinicBillingSettingAction = cache(async (clinicUid: string) => {
  let message = "Clinic billing settings fetched successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    let billingSetting = await prisma.clinicBillingSetting.findFirst({
      where: { Clinic: { clinicUid } },
    });

    // If setting doesn't exist yet, lazily create a default one for the clinic
    if (!billingSetting) {
      const clinic = await prisma.clinic.findUnique({
        where: { clinicUid },
        select: { id: true, name: true },
      });

      if (!clinic) throw new Error("Clinic not found");

      billingSetting = await prisma.clinicBillingSetting.create({
        data: {
          clinicId: clinic.id,
          billingMode: "COMMERCIAL",
          currency: "PHP",
          registeredBusinessName: clinic.name,
        },
      });
    }

    return { status: true, message, data: billingSetting };
  } catch (error) {
    console.error("getClinicBillingSettingAction error:", error);
    message = "Error while fetching clinic billing settings";
    if (error instanceof Error) message = error.message;
    if (hasCodeProperty(error) && error.code === "P2025") message = "Clinic not found";
    return { status: false, message, data: null };
  }
});

export type UpsertClinicBillingSettingInput = {
  clinicUid: string;
  billingMode?: ClinicBillingMode;
  currency?: string;
  isVatRegistered?: boolean;
  vatRate?: number;
  tinNumber?: string | null;
  birPermitNumber?: string | null;
  registeredBusinessName?: string | null;
  registeredAddress?: string | null;
  invoicePrefix?: string;
  receiptPrefix?: string;
  receiptFooterNotes?: string | null;
  enableDoctorPfTracking?: boolean;
  enableHmoBilling?: boolean;
};

export const upsertClinicBillingSettingAction = async (input: UpsertClinicBillingSettingInput) => {
  let message = "Clinic billing settings updated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map((p) => p.name);
    const canUpdate =
      myPermissionArray.includes(PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name) ||
      myPermissionArray.includes(PERMISSIONS.CLINIC["MANAGE:CLINIC:BILLING"].name);

    if (!canUpdate) {
      throw new Error("You do not have permission to update clinic billing settings.");
    }

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid: input.clinicUid },
      select: { id: true },
    });

    if (!clinic) throw new Error("Clinic not found");

    const updated = await prisma.clinicBillingSetting.upsert({
      where: { clinicId: clinic.id },
      create: {
        clinicId: clinic.id,
        billingMode: input.billingMode ?? "COMMERCIAL",
        currency: input.currency ?? "PHP",
        isVatRegistered: input.isVatRegistered ?? false,
        vatRate: input.vatRate ?? 12.0,
        tinNumber: input.tinNumber,
        birPermitNumber: input.birPermitNumber,
        registeredBusinessName: input.registeredBusinessName,
        registeredAddress: input.registeredAddress,
        invoicePrefix: input.invoicePrefix ?? "INV-",
        receiptPrefix: input.receiptPrefix ?? "OR-",
        receiptFooterNotes: input.receiptFooterNotes,
        enableDoctorPfTracking: input.enableDoctorPfTracking ?? true,
        enableHmoBilling: input.enableHmoBilling ?? true,
      },
      update: {
        ...(input.billingMode !== undefined && { billingMode: input.billingMode }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.isVatRegistered !== undefined && { isVatRegistered: input.isVatRegistered }),
        ...(input.vatRate !== undefined && { vatRate: input.vatRate }),
        ...(input.tinNumber !== undefined && { tinNumber: input.tinNumber }),
        ...(input.birPermitNumber !== undefined && { birPermitNumber: input.birPermitNumber }),
        ...(input.registeredBusinessName !== undefined && { registeredBusinessName: input.registeredBusinessName }),
        ...(input.registeredAddress !== undefined && { registeredAddress: input.registeredAddress }),
        ...(input.invoicePrefix !== undefined && { invoicePrefix: input.invoicePrefix }),
        ...(input.receiptPrefix !== undefined && { receiptPrefix: input.receiptPrefix }),
        ...(input.receiptFooterNotes !== undefined && { receiptFooterNotes: input.receiptFooterNotes }),
        ...(input.enableDoctorPfTracking !== undefined && { enableDoctorPfTracking: input.enableDoctorPfTracking }),
        ...(input.enableHmoBilling !== undefined && { enableHmoBilling: input.enableHmoBilling }),
      },
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("upsertClinicBillingSettingAction error:", error);
    message = "Error while updating clinic billing settings";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};
