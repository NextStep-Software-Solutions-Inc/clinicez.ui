"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"

function getModelName(slug: string): string | null {
  const map: Record<string, string> = {
    "diagnostic-category": "konsultaDiagnosticCategory",
    "medicine": "konsultaMedicine",
    "medicine-form": "konsultaMedicineForm",
    "medicine-strength": "konsultaMedicineStrength",
    "medicine-salt": "konsultaMedicineSalt",
    "medicine-package": "konsultaMedicinePackage",
    "medicine-unit": "konsultaMedicineUnit",
    "icd": "konsultaIcd",
    "zscore": "konsultaZScore",
    "ncdq": "konsultaNcdq",
    "abdomen": "konsultaAbdomen",
    "chest": "konsultaChest",
    "chestxray-findings": "konsultaChestxrayFindings"
  };
  return map[slug] || null;
}

export const getMasterListRecordsAction = withErrorHandling(async (slug: string) => {
  const modelName = getModelName(slug);
  if (!modelName) throw new Error("Invalid master list slug");

  // @ts-ignore
  const records = await prisma[modelName].findMany({
    orderBy: { createdAt: 'desc' }
  });
  return { message: "Success", data: records };
})

export const saveMasterListRecordAction = withErrorHandling(async (slug: string, data: any) => {
  const modelName = getModelName(slug);
  if (!modelName) throw new Error("Invalid master list slug");

  const { id, ...fields } = data;

  if (id) {
    // @ts-ignore
    const updated = await prisma[modelName].update({
      where: { id },
      data: fields
    });
    return { message: "Record updated", data: updated };
  } else {
    // @ts-ignore
    const created = await prisma[modelName].create({
      data: fields
    });
    return { message: "Record created", data: created };
  }
})

export const deleteMasterListRecordAction = withErrorHandling(async (slug: string, id: number) => {
  const modelName = getModelName(slug);
  if (!modelName) throw new Error("Invalid master list slug");

  // @ts-ignore
  await prisma[modelName].delete({
    where: { id }
  });
  return { message: "Record deleted", data: null };
})
