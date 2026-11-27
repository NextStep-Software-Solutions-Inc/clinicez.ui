"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ImmunizationCategory } from "@prisma/client";

export type ManageVaccineInput = {
  name: string;
  type?: string;
  category?: ImmunizationCategory;
  code?: string;
  description?: string;
  doseNumber?: number | null;
  defaultDoseLabel?: string | null;
  defaultRoute?: string | null;
  targetGender?: string | null;
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
  childImmcode?: string;
  youngwImmcode?: string;
  pregwImmcode?: string;
  elderlyImmcode?: string;
  otherImm?: string;
};

export const createVaccineAction = async (input: ManageVaccineInput) => {
  try {
    const category = input.category || (input.type as ImmunizationCategory) || ImmunizationCategory.CHILD;
    const code = input.code || input.childImmcode || input.youngwImmcode || input.pregwImmcode || input.elderlyImmcode || 'CUSTOM';

    const item = await prisma.philHealthImmunizationLibrary.create({
      data: {
        name: input.name,
        category,
        code,
        description: input.description,
        doseNumber: input.doseNumber || null,
        defaultDoseLabel: input.defaultDoseLabel || null,
        defaultRoute: input.defaultRoute || null,
        targetGender: input.targetGender || null,
        minAgeMonths: input.minAgeMonths || null,
        maxAgeMonths: input.maxAgeMonths || null,
        isActive: true,
      },
    });

    revalidatePath("/super-admin/vaccines");
    return { success: true, data: item, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to create immunization library item",
    };
  }
};

export const updateVaccineAction = async (id: number, input: ManageVaccineInput) => {
  try {
    const item = await prisma.philHealthImmunizationLibrary.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        defaultRoute: input.defaultRoute,
        defaultDoseLabel: input.defaultDoseLabel,
      },
    });

    revalidatePath("/super-admin/vaccines");
    return { success: true, data: item, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to update immunization item",
    };
  }
};

export const deleteVaccineAction = async (id: number) => {
  try {
    const item = await prisma.philHealthImmunizationLibrary.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/super-admin/vaccines");
    return { success: true, data: item, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to deactivate immunization item",
    };
  }
};

export const toggleVaccineStatusAction = async (id: number, isActive: boolean) => {
  try {
    const item = await prisma.philHealthImmunizationLibrary.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/super-admin/vaccines");
    return { success: true, data: item, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to toggle status",
    };
  }
};
