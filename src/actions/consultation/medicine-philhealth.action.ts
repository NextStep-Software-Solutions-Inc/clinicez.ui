"use server";

import prismaClient from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export interface UpsertMedicinePhilHealthPayload {
  medicineId: number;
  drugCode?: string;
  genericCode?: string;
  saltCode?: string;
  strengthCode?: string;
  formCode?: string;
  unitCode?: string;
  packageCode?: string;
  route?: string;
  otherMedicine?: string;
  othMedDrugGrouping?: string;
}

export const upsertMedicinePhilHealthAction = withErrorHandling(
  async (payload: UpsertMedicinePhilHealthPayload) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const { medicineId, ...data } = payload;

    const result = await prismaClient.medicinePhilHealthData.upsert({
      where: { medicineId },
      create: {
        medicineId,
        ...data,
      },
      update: data,
    });

    return { data: result, message: "PhilHealth medicine data saved" };
  }
);

export const getMedicinePhilHealthAction = withErrorHandling(
  async (medicineId: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const data = await prismaClient.medicinePhilHealthData.findUnique({
      where: { medicineId },
    });

    return { data, message: "PhilHealth medicine data retrieved" };
  }
);
