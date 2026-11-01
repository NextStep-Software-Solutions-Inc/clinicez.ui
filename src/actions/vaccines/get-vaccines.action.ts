"use server";

import prisma from "@lib/prisma";
import { ImmunizationCategory } from "@prisma/client";

export type GetVaccinesResponse = Awaited<ReturnType<typeof getVaccinesAction>>;

export const getVaccinesAction = async (includeInactive: boolean = false) => {
  try {
    const immunizations = await prisma.philHealthImmunizationLibrary.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
    });

    return {
      success: true,
      data: immunizations.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category,
        type: item.category,
        description: item.description,
        doseNumber: item.doseNumber,
        defaultDoseLabel: item.defaultDoseLabel,
        defaultRoute: item.defaultRoute,
        targetGender: item.targetGender,
        minAgeMonths: item.minAgeMonths,
        maxAgeMonths: item.maxAgeMonths,
        isActive: item.isActive,
        // Legacy PhilHealthData adapter for super admin UI compatibility
        PhilHealthData: {
          childImmcode: item.category === ImmunizationCategory.CHILD ? item.code : null,
          youngwImmcode: item.category === ImmunizationCategory.YOUNG_WOMAN ? item.code : null,
          pregwImmcode: item.category === ImmunizationCategory.PREGNANT ? item.code : null,
          elderlyImmcode: item.category === ImmunizationCategory.ELDERLY ? item.code : null,
          otherImm: null,
        },
      })),
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch immunizations",
    };
  }
};

export const getImmunizationLibraryByCategoryAction = async (category?: ImmunizationCategory) => {
  try {
    const items = await prisma.philHealthImmunizationLibrary.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });
    return { success: true, data: items, error: null };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch library",
    };
  }
};

export const getRoutesAction = async () => {
  return {
    success: true,
    data: [
      { id: 1, route: "Oral", description: "Oral ingestion" },
      { id: 2, route: "Intramuscular", description: "Intramuscular injection" },
      { id: 3, route: "Subcutaneous", description: "Subcutaneous injection" },
      { id: 4, route: "Intradermal", description: "Intradermal injection" },
    ],
    error: null,
  };
};

export const getDosesAction = async () => {
  return {
    success: true,
    data: [
      { id: 1, dose: "1st Dose", description: "Primary dose" },
      { id: 2, dose: "2nd Dose", description: "Second primary dose" },
      { id: 3, dose: "3rd Dose", description: "Third primary dose" },
      { id: 4, dose: "Booster 1", description: "First booster shot" },
      { id: 5, dose: "Booster 2", description: "Second booster shot" },
      { id: 6, dose: "Annual Dose", description: "Annual seasonal vaccination" },
    ],
    error: null,
  };
};
