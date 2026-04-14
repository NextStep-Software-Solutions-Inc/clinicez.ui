"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";
import { z } from "zod";

// ─── Error Messages ────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized: Only super admins can manage location data",
  REGION_NOT_FOUND: "Region not found",
  PROVINCE_NOT_FOUND: "Province not found",
  MUNICIPALITY_NOT_FOUND: "Municipality not found",
  BARANGAY_NOT_FOUND: "Barangay not found",
  DUPLICATE_CODE: "A record with this code already exists",
};

// ─── Zod Schemas ──────────────────────────────────────────────────────────

const regionSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  regionName: z.string().min(1).max(200),
  isActive: z.boolean().optional().default(true),
});

const provinceSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  regionCode: z.string().min(1).max(20),
  isActive: z.boolean().optional().default(true),
});

const municipalitySchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  provinceCode: z.string().min(1).max(20),
  isCity: z.boolean().optional().default(false),
  isCapital: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

const barangaySchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  municipalityCode: z.string().min(1).max(20),
  isActive: z.boolean().optional().default(true),
});

// ─── Type Exports ─────────────────────────────────────────────────────────

export type GetRegionsResult = Awaited<ReturnType<typeof getRegionsAction>>;
export type GetProvincesResult = Awaited<ReturnType<typeof getProvincesAction>>;
export type GetMunicipalitiesResult = Awaited<ReturnType<typeof getMunicipalitiesAction>>;
export type GetBarangaysResult = Awaited<ReturnType<typeof getBarangaysAction>>;

// ─── Region Actions ───────────────────────────────────────────────────────

export async function getRegionsAction({
  search,
  pageSize = 20,
  pageNumber = 1,
  activeOnly = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  activeOnly?: boolean;
} = {}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const where = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { regionName: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.phRegion.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        name: true,
        regionName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { provinces: true } },
      },
    }),
    prisma.phRegion.count({ where }),
  ]);

  return {
    data,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createRegionAction(input: z.infer<typeof regionSchema>) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = regionSchema.parse(input);

  return prisma.phRegion.create({
    data: parsed,
    select: { id: true, code: true, name: true, regionName: true, isActive: true },
  });
}

export async function updateRegionAction(
  id: number,
  input: z.infer<typeof regionSchema>
) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = regionSchema.parse(input);

  return prisma.phRegion.update({
    where: { id },
    data: parsed,
    select: { id: true, code: true, name: true, regionName: true, isActive: true },
  });
}

export async function toggleRegionActiveAction(id: number, isActive: boolean) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phRegion.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });
}

export async function deleteRegionAction(id: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phRegion.delete({ where: { id } });
}

// ─── Province Actions ─────────────────────────────────────────────────────

export async function getProvincesAction({
  search,
  regionCode,
  pageSize = 20,
  pageNumber = 1,
  activeOnly = false,
}: {
  search?: string;
  regionCode?: string;
  pageSize?: number;
  pageNumber?: number;
  activeOnly?: boolean;
} = {}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const where = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(regionCode ? { regionCode } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.phProvince.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        name: true,
        regionCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        region: { select: { name: true, regionName: true } },
        _count: { select: { municipalities: true } },
      },
    }),
    prisma.phProvince.count({ where }),
  ]);

  return {
    data,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createProvinceAction(input: z.infer<typeof provinceSchema>) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = provinceSchema.parse(input);

  return prisma.phProvince.create({
    data: parsed,
    select: { id: true, code: true, name: true, regionCode: true, isActive: true },
  });
}

export async function updateProvinceAction(
  id: number,
  input: z.infer<typeof provinceSchema>
) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = provinceSchema.parse(input);

  return prisma.phProvince.update({
    where: { id },
    data: parsed,
    select: { id: true, code: true, name: true, regionCode: true, isActive: true },
  });
}

export async function toggleProvinceActiveAction(id: number, isActive: boolean) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phProvince.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });
}

export async function deleteProvinceAction(id: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phProvince.delete({ where: { id } });
}

// ─── Municipality Actions ─────────────────────────────────────────────────

export async function getMunicipalitiesAction({
  search,
  provinceCode,
  pageSize = 20,
  pageNumber = 1,
  activeOnly = false,
}: {
  search?: string;
  provinceCode?: string;
  pageSize?: number;
  pageNumber?: number;
  activeOnly?: boolean;
} = {}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const where = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(provinceCode ? { provinceCode } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.phMunicipality.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        name: true,
        provinceCode: true,
        isCity: true,
        isCapital: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        province: { select: { name: true, regionCode: true } },
        _count: { select: { barangays: true } },
      },
    }),
    prisma.phMunicipality.count({ where }),
  ]);

  return {
    data,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createMunicipalityAction(input: z.infer<typeof municipalitySchema>) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = municipalitySchema.parse(input);

  return prisma.phMunicipality.create({
    data: parsed,
    select: { id: true, code: true, name: true, provinceCode: true, isCity: true, isCapital: true, isActive: true },
  });
}

export async function updateMunicipalityAction(
  id: number,
  input: z.infer<typeof municipalitySchema>
) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = municipalitySchema.parse(input);

  return prisma.phMunicipality.update({
    where: { id },
    data: parsed,
    select: { id: true, code: true, name: true, provinceCode: true, isCity: true, isCapital: true, isActive: true },
  });
}

export async function toggleMunicipalityActiveAction(id: number, isActive: boolean) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phMunicipality.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });
}

export async function deleteMunicipalityAction(id: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phMunicipality.delete({ where: { id } });
}

// ─── Barangay Actions ─────────────────────────────────────────────────────

export async function getBarangaysAction({
  search,
  municipalityCode,
  pageSize = 20,
  pageNumber = 1,
  activeOnly = false,
}: {
  search?: string;
  municipalityCode?: string;
  pageSize?: number;
  pageNumber?: number;
  activeOnly?: boolean;
} = {}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const where = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(municipalityCode ? { municipalityCode } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.phBarangay.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        name: true,
        municipalityCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        municipality: { select: { name: true, provinceCode: true } },
      },
    }),
    prisma.phBarangay.count({ where }),
  ]);

  return {
    data,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createBarangayAction(input: z.infer<typeof barangaySchema>) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = barangaySchema.parse(input);

  return prisma.phBarangay.create({
    data: parsed,
    select: { id: true, code: true, name: true, municipalityCode: true, isActive: true },
  });
}

export async function updateBarangayAction(
  id: number,
  input: z.infer<typeof barangaySchema>
) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const parsed = barangaySchema.parse(input);

  return prisma.phBarangay.update({
    where: { id },
    data: parsed,
    select: { id: true, code: true, name: true, municipalityCode: true, isActive: true },
  });
}

export async function toggleBarangayActiveAction(id: number, isActive: boolean) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phBarangay.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });
}

export async function deleteBarangayAction(id: number) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phBarangay.delete({ where: { id } });
}

// ─── "For Select" lightweight actions ────────────────────────────────────
// Compact lists intended for use in dropdowns / comboboxes.

export async function getRegionsForSelectAction() {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phRegion.findMany({
    orderBy: { name: "asc" },
    select: { code: true, name: true, regionName: true },
  });
}

export async function getProvincesForSelectAction(regionCode?: string) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  return prisma.phProvince.findMany({
    where: regionCode ? { regionCode } : undefined,
    orderBy: { name: "asc" },
    select: { code: true, name: true, regionCode: true },
  });
}

export async function getMunicipalitiesForSelectAction({
  provinceCode,
  search,
}: {
  provinceCode?: string;
  search?: string;
} = {}) {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  const where = {
    ...(provinceCode ? { provinceCode } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  return prisma.phMunicipality.findMany({
    where,
    orderBy: { name: "asc" },
    take: 100,
    select: { code: true, name: true, provinceCode: true },
  });
}

// ─── Seed Action ───────────────────────────────────────────────────────────

// Rows per raw-SQL INSERT … ON CONFLICT batch.
// 1 000 rows × max 5 columns = 5 000 bind params per statement (well under the
// PostgreSQL 65 535 limit), while keeping the total number of round-trips low.
const SEED_CHUNK_SIZE = 1000;

export async function seedLocationsFromJsonAction(): Promise<{
  regions: number;
  provinces: number;
  municipalities: number;
  barangays: number;
}> {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

  // Dynamic import to avoid bundling the large JSON at build time
  const locationsData = (await import("@/data/philippines-locations.json", {
    assert: { type: "json" },
  })) as { default: { regions: PhilippineRegionJson[] } };

  const regions = locationsData.default.regions;

  // ── Flatten all records ───────────────────────────────────────────────────

  const regionRecords = regions.map((r) => ({
    code: r.code,
    name: r.name,
    regionName: r.regionName,
  }));

  const provinceRecords: { code: string; name: string; regionCode: string }[] = [];
  const municipalityRecords: {
    code: string;
    name: string;
    provinceCode: string;
    isCity: boolean;
    isCapital: boolean;
  }[] = [];
  const barangayRecords: { code: string; name: string; municipalityCode: string }[] = [];

  for (const region of regions) {
    for (const province of region.provinces) {
      provinceRecords.push({ code: province.code, name: province.name, regionCode: region.code });

      const cityCodes = new Set((province.cities ?? []).map((c) => c.code));
      const allCities = [...(province.cities ?? []), ...(province.municipalities ?? [])];

      for (const city of allCities) {
        municipalityRecords.push({
          code: city.code,
          name: city.name,
          provinceCode: province.code,
          isCity: cityCodes.has(city.code),
          isCapital: city.isCapital ?? false,
        });

        for (const barangay of city.barangays ?? []) {
          barangayRecords.push({
            code: barangay.code,
            name: barangay.name,
            municipalityCode: city.code,
          });
        }
      }
    }
  }

  // ── Raw-SQL upsert helpers ────────────────────────────────────────────────
  // Table and column names are hardcoded (never user-supplied); only record
  // *values* are bound as positional parameters to prevent SQL injection.

  const upsertRegionChunk = async (chunk: typeof regionRecords) => {
    if (!chunk.length) return;
    const ph = chunk.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, NOW(), NOW())`).join(", ");
    const vals = chunk.flatMap((r) => [r.code, r.name, r.regionName]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PhRegion" (code, name, "regionName", "createdAt", "updatedAt")
       VALUES ${ph}
       ON CONFLICT (code) DO NOTHING`,
      ...vals
    );
  };

  const upsertProvinceChunk = async (chunk: typeof provinceRecords) => {
    if (!chunk.length) return;
    const ph = chunk.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, NOW(), NOW())`).join(", ");
    const vals = chunk.flatMap((p) => [p.code, p.name, p.regionCode]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PhProvince" (code, name, "regionCode", "createdAt", "updatedAt")
       VALUES ${ph}
       ON CONFLICT (code) DO NOTHING`,
      ...vals
    );
  };

  const upsertMunicipalityChunk = async (chunk: typeof municipalityRecords) => {
    if (!chunk.length) return;
    const ph = chunk
      .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, NOW(), NOW())`)
      .join(", ");
    const vals = chunk.flatMap((m) => [m.code, m.name, m.provinceCode, m.isCity, m.isCapital]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PhMunicipality" (code, name, "provinceCode", "isCity", "isCapital", "createdAt", "updatedAt")
       VALUES ${ph}
       ON CONFLICT (code) DO NOTHING`,
      ...vals
    );
  };

  const upsertBarangayChunk = async (chunk: typeof barangayRecords) => {
    if (!chunk.length) return;
    const ph = chunk.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, NOW(), NOW())`).join(", ");
    const vals = chunk.flatMap((b) => [b.code, b.name, b.municipalityCode]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PhBarangay" (code, name, "municipalityCode", "createdAt", "updatedAt")
       VALUES ${ph}
       ON CONFLICT (code) DO NOTHING`,
      ...vals
    );
  };

  // ── Execute in FK dependency order ────────────────────────────────────────

  for (let i = 0; i < regionRecords.length; i += SEED_CHUNK_SIZE) {
    await upsertRegionChunk(regionRecords.slice(i, i + SEED_CHUNK_SIZE));
  }
  for (let i = 0; i < provinceRecords.length; i += SEED_CHUNK_SIZE) {
    await upsertProvinceChunk(provinceRecords.slice(i, i + SEED_CHUNK_SIZE));
  }
  for (let i = 0; i < municipalityRecords.length; i += SEED_CHUNK_SIZE) {
    await upsertMunicipalityChunk(municipalityRecords.slice(i, i + SEED_CHUNK_SIZE));
  }
  for (let i = 0; i < barangayRecords.length; i += SEED_CHUNK_SIZE) {
    await upsertBarangayChunk(barangayRecords.slice(i, i + SEED_CHUNK_SIZE));
  }

  return {
    regions: regionRecords.length,
    provinces: provinceRecords.length,
    municipalities: municipalityRecords.length,
    barangays: barangayRecords.length,
  };
}

// ─── Internal Types ────────────────────────────────────────────────────────

interface PhilippineBarangayJson {
  code: string;
  name: string;
}

interface PhilippineCityJson {
  code: string;
  name: string;
  isCapital?: boolean;
  barangays?: PhilippineBarangayJson[];
}

interface PhilippineProvinceJson {
  code: string;
  name: string;
  cities?: PhilippineCityJson[];
  municipalities?: PhilippineCityJson[];
}

interface PhilippineRegionJson {
  code: string;
  name: string;
  regionName: string;
  provinces: PhilippineProvinceJson[];
}
