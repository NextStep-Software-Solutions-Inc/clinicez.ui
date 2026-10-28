"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import type { PriceCategory } from "@prisma/client";

export type GetClinicPriceItems = Awaited<ReturnType<typeof getClinicPriceItemsAction>>;

export const getClinicPriceItemsAction = cache(
  async (clinicUid: string, category?: PriceCategory, search?: string) => {
    let message = "Price items fetched successfully";

    try {
      const session = await getCachedSession();
      if (!session) throw new Error("User not authenticated.");

      const whereClause: any = {
        Clinic: { clinicUid },
        isActive: true,
      };

      if (category) {
        whereClause.category = category;
      }

      if (search && search.trim()) {
        whereClause.OR = [
          { name: { contains: search.trim(), mode: "insensitive" } },
          { code: { contains: search.trim(), mode: "insensitive" } },
        ];
      }

      const items = await prisma.clinicPriceItem.findMany({
        where: whereClause,
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      return { status: true, message, data: items };
    } catch (error) {
      console.error("getClinicPriceItemsAction error:", error);
      message = "Error fetching price items";
      if (error instanceof Error) message = error.message;
      return { status: false, message, data: [] };
    }
  }
);

export type CreatePriceItemInput = {
  clinicUid: string;
  code?: string;
  name: string;
  description?: string;
  category: PriceCategory;
  unitPrice: number;
  isVatable?: boolean;
  defaultDoctorSharePercent?: number;
};

export const createClinicPriceItemAction = async (input: CreatePriceItemInput) => {
  let message = "Price item created successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map((p) => p.name);
    const canManage =
      myPermissionArray.includes(PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name) ||
      myPermissionArray.includes(PERMISSIONS.CLINIC["MANAGE:CLINIC:PRICE_LIST"].name) ||
      myPermissionArray.includes(PERMISSIONS.CLINIC["MANAGE:CLINIC:BILLING"].name);

    if (!canManage) {
      throw new Error("You do not have permission to manage price items.");
    }

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid: input.clinicUid },
      select: { id: true },
    });

    if (!clinic) throw new Error("Clinic not found");

    const created = await prisma.clinicPriceItem.create({
      data: {
        clinicId: clinic.id,
        code: input.code?.trim() || null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        category: input.category,
        unitPrice: input.unitPrice,
        isVatable: input.isVatable ?? true,
        defaultDoctorSharePercent: input.defaultDoctorSharePercent ?? null,
      },
    });

    return { status: true, message, data: created };
  } catch (error) {
    console.error("createClinicPriceItemAction error:", error);
    message = "Error creating price item";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export type UpdatePriceItemInput = {
  priceItemId: number;
  clinicUid: string;
  code?: string;
  name?: string;
  description?: string;
  category?: PriceCategory;
  unitPrice?: number;
  isVatable?: boolean;
  defaultDoctorSharePercent?: number | null;
  isActive?: boolean;
};

export const updateClinicPriceItemAction = async (input: UpdatePriceItemInput) => {
  let message = "Price item updated successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map((p) => p.name);
    const canManage =
      myPermissionArray.includes(PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name) ||
      myPermissionArray.includes(PERMISSIONS.CLINIC["MANAGE:CLINIC:PRICE_LIST"].name) ||
      myPermissionArray.includes(PERMISSIONS.CLINIC["MANAGE:CLINIC:BILLING"].name);

    if (!canManage) {
      throw new Error("You do not have permission to manage price items.");
    }

    const updated = await prisma.clinicPriceItem.update({
      where: { id: input.priceItemId },
      data: {
        ...(input.code !== undefined && { code: input.code?.trim() || null }),
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
        ...(input.isVatable !== undefined && { isVatable: input.isVatable }),
        ...(input.defaultDoctorSharePercent !== undefined && {
          defaultDoctorSharePercent: input.defaultDoctorSharePercent,
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return { status: true, message, data: updated };
  } catch (error) {
    console.error("updateClinicPriceItemAction error:", error);
    message = "Error updating price item";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const deleteClinicPriceItemAction = async (priceItemId: number) => {
  let message = "Price item deleted successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    await prisma.clinicPriceItem.update({
      where: { id: priceItemId },
      data: { isActive: false },
    });

    return { status: true, message, data: null };
  } catch (error) {
    console.error("deleteClinicPriceItemAction error:", error);
    message = "Error deleting price item";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const seedStandardClinicPricesAction = async (clinicUid: string) => {
  let message = "Standard clinic prices seeded successfully";

  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });

    if (!clinic) throw new Error("Clinic not found");

    const defaultPrices = [
      { code: "CONS-GP", name: "General Consultation", category: "CONSULTATION" as PriceCategory, unitPrice: 500, defaultDoctorSharePercent: 70 },
      { code: "CONS-SP", name: "Specialist Consultation", category: "CONSULTATION" as PriceCategory, unitPrice: 800, defaultDoctorSharePercent: 80 },
      { code: "CONS-FU", name: "Follow-up Consultation", category: "CONSULTATION" as PriceCategory, unitPrice: 350, defaultDoctorSharePercent: 70 },
      { code: "LAB-CBC", name: "Complete Blood Count (CBC) with Platelet", category: "LABORATORY" as PriceCategory, unitPrice: 250 },
      { code: "LAB-UA", name: "Routine Urinalysis", category: "LABORATORY" as PriceCategory, unitPrice: 150 },
      { code: "LAB-FA", name: "Fecalysis", category: "LABORATORY" as PriceCategory, unitPrice: 150 },
      { code: "LAB-FBS", name: "Fasting Blood Sugar (FBS)", category: "LABORATORY" as PriceCategory, unitPrice: 200 },
      { code: "LAB-LIPID", name: "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", category: "LABORATORY" as PriceCategory, unitPrice: 650 },
      { code: "IMG-CXR", name: "Chest X-Ray PA/AP", category: "IMAGING" as PriceCategory, unitPrice: 400 },
      { code: "IMG-US-AB", name: "Whole Abdomen Ultrasound", category: "IMAGING" as PriceCategory, unitPrice: 1500, defaultDoctorSharePercent: 50 },
      { code: "HS-ECG", name: "12-Lead Electrocardiogram (ECG)", category: "HEART_STATION" as PriceCategory, unitPrice: 350 },
      { code: "PROC-NEB", name: "Nebulization Session", category: "PROCEDURE" as PriceCategory, unitPrice: 200 },
      { code: "PROC-WD", name: "Wound Dressing / Minor Suture", category: "PROCEDURE" as PriceCategory, unitPrice: 450, defaultDoctorSharePercent: 60 },
      { code: "CERT-MED", name: "Medical Certificate", category: "OTHER" as PriceCategory, unitPrice: 200 },
      { code: "CERT-FTW", name: "Fit to Work Clearance", category: "OTHER" as PriceCategory, unitPrice: 300 },
    ];

    for (const item of defaultPrices) {
      await prisma.clinicPriceItem.upsert({
        where: {
          clinicId_code: {
            clinicId: clinic.id,
            code: item.code,
          },
        },
        create: {
          clinicId: clinic.id,
          code: item.code,
          name: item.name,
          category: item.category,
          unitPrice: item.unitPrice,
          isVatable: true,
          defaultDoctorSharePercent: item.defaultDoctorSharePercent || null,
        },
        update: {
          isActive: true,
        },
      });
    }

    return { status: true, message, data: { count: defaultPrices.length } };
  } catch (error) {
    console.error("seedStandardClinicPricesAction error:", error);
    message = "Error seeding standard prices";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};
