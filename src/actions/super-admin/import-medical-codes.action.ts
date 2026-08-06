"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

async function requireSuperAdmin(): Promise<void> {
  const ok = await isSuperAdminAction();
  if (!ok) throw new Error("Super admin privileges required.");
}

// ─────────────────────────────────────────────────────────────
// ICD-10 import
// ─────────────────────────────────────────────────────────────

export interface ICD10Row {
  orderNum?: number;
  code: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  hippaCovered?: boolean;
  category?: string;
}

export interface ImportBatchResult {
  upserted: number;
  errors: string[];
}

/**
 * Upsert a batch of ICD-10 codes.
 * Matches on `code` (unique). Creates new codes; updates description/category on existing ones.
 */
export async function importICD10BatchAction(
  rows: ICD10Row[]
): Promise<ImportBatchResult> {
  await requireSuperAdmin();

  const errors: string[] = [];
  let upserted = 0;

  for (const row of rows) {
    const code = row.code?.trim().toUpperCase();
    const displayDescription = row.shortDescription?.trim() || row.description?.trim();

    if (!code || !displayDescription) {
      errors.push(`Skipped row – missing code or description`);
      continue;
    }

    const upsertData = {
      description: displayDescription,
      shortDescription: row.shortDescription?.trim() || null,
      longDescription: row.longDescription?.trim() || null,
      hippaCovered: row.hippaCovered ?? false,
      orderNum: row.orderNum ?? null,
      category: row.category?.trim() || null,
      isActive: true,
    };

    try {
      await prisma.iCD10Code.upsert({
        where: { code },
        update: upsertData,
        create: { code, ...upsertData },
      });
      upserted++;
    } catch (err) {
      errors.push(`Failed to upsert ${code}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { upserted, errors };
}

/**
 * After all batches are imported, deactivate any ICD-10 codes NOT in the imported set.
 * Returns the count of deactivated records.
 */
export async function finalizeICD10ImportAction(
  importedCodes: string[]
): Promise<{ deactivated: number }> {
  await requireSuperAdmin();

  const upperCodes = importedCodes.map((c) => c.toUpperCase());

  const result = await prisma.iCD10Code.updateMany({
    where: {
      code: { notIn: upperCodes },
      isActive: true,
    },
    data: { isActive: false },
  });

  return { deactivated: result.count };
}

// ─────────────────────────────────────────────────────────────
// RVS procedure import
// ─────────────────────────────────────────────────────────────

export type RVSProcedureType = "imaging" | "laboratory" | "heart_station";

export interface RVSProcedureRow {
  name: string;
  category: string;
  rvsCode?: string;
  description?: string;
}

/**
 * Upsert a batch of RVS procedure rows into the appropriate master table.
 * Matches on `name + category` (unique constraint).
 */
export async function importRVSProcedureBatchAction(
  type: RVSProcedureType,
  rows: RVSProcedureRow[]
): Promise<ImportBatchResult> {
  await requireSuperAdmin();

  const errors: string[] = [];
  let upserted = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    const category = row.category?.trim();

    if (!name || !category) {
      errors.push(`Skipped row – missing name or category`);
      continue;
    }

    const data = {
      description: row.description?.trim() || null,
      rvsCode: row.rvsCode?.trim() || null,
      isActive: true,
    };

    try {
      if (type === "imaging") {
        await prisma.imagingProcedure.upsert({
          where: { unique_imaging_procedure: { name, category } },
          update: data,
          create: { name, category, ...data },
        });
      } else if (type === "laboratory") {
        await prisma.laboratoryProcedure.upsert({
          where: { unique_laboratory_procedure: { name, category } },
          update: data,
          create: { name, category, ...data },
        });
      } else {
        await prisma.heartStationProcedure.upsert({
          where: { unique_heart_station_procedure: { name, category } },
          update: data,
          create: { name, category, ...data },
        });
      }
      upserted++;
    } catch (err) {
      errors.push(`Failed to upsert ${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { upserted, errors };
}

/**
 * After all batches are imported, deactivate master procedures NOT in the imported set.
 * Keyed on `name` for the given procedure type.
 */
export async function finalizeRVSImportAction(
  type: RVSProcedureType,
  importedNames: string[]
): Promise<{ deactivated: number }> {
  await requireSuperAdmin();

  const names = importedNames.map((n) => n.trim()).filter(Boolean);

  let count = 0;

  if (type === "imaging") {
    const result = await prisma.imagingProcedure.updateMany({
      where: { name: { notIn: names }, isActive: true },
      data: { isActive: false },
    });
    count = result.count;
  } else if (type === "laboratory") {
    const result = await prisma.laboratoryProcedure.updateMany({
      where: { name: { notIn: names }, isActive: true },
      data: { isActive: false },
    });
    count = result.count;
  } else {
    const result = await prisma.heartStationProcedure.updateMany({
      where: { name: { notIn: names }, isActive: true },
      data: { isActive: false },
    });
    count = result.count;
  }

  return { deactivated: count };
}

// ─────────────────────────────────────────────────────────────
// ICD-10 search (for autocomplete in consultations)
// ─────────────────────────────────────────────────────────────

export interface ICD10SearchResult {
  code: string;
  description: string;
  category: string | null;
}

export async function searchICD10CodesAction(
  query: string,
  limit = 20
): Promise<ICD10SearchResult[]> {
  const trimmed = query?.trim() || "";

  if (trimmed.length < 2) {
    const results = await prisma.iCD10Code.findMany({
      where: { isActive: true },
      select: { code: true, description: true, category: true },
      orderBy: [{ code: "asc" }],
      take: limit,
    });
    return results;
  }

  const results = await prisma.iCD10Code.findMany({
    where: {
      isActive: true,
      OR: [
        { code: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { shortDescription: { contains: trimmed, mode: "insensitive" } },
        { longDescription: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { code: true, description: true, category: true },
    orderBy: [{ code: "asc" }],
    take: limit,
  });

  return results;
}
