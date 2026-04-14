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

// ─── Seed Action ───────────────────────────────────────────────────────────

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

  // Flatten all records at each level for efficient batch operations
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

  // Upsert regions first (parent), then provinces, then municipalities, then barangays
  // Use createMany with skipDuplicates for new records, then update existing ones
  await prisma.phRegion.createMany({ data: regionRecords, skipDuplicates: true });
  await prisma.$transaction(
    regionRecords.map((r) =>
      prisma.phRegion.update({ where: { code: r.code }, data: { name: r.name, regionName: r.regionName } })
    )
  );

  await prisma.phProvince.createMany({ data: provinceRecords, skipDuplicates: true });
  await prisma.$transaction(
    provinceRecords.map((p) =>
      prisma.phProvince.update({ where: { code: p.code }, data: { name: p.name, regionCode: p.regionCode } })
    )
  );

  // Municipalities: batch in chunks to avoid hitting transaction limits
  const CHUNK_SIZE = 500;
  await prisma.phMunicipality.createMany({ data: municipalityRecords, skipDuplicates: true });
  for (let i = 0; i < municipalityRecords.length; i += CHUNK_SIZE) {
    const chunk = municipalityRecords.slice(i, i + CHUNK_SIZE);
    await prisma.$transaction(
      chunk.map((m) =>
        prisma.phMunicipality.update({
          where: { code: m.code },
          data: { name: m.name, provinceCode: m.provinceCode, isCity: m.isCity, isCapital: m.isCapital },
        })
      )
    );
  }

  // Barangays: batch in larger chunks
  await prisma.phBarangay.createMany({ data: barangayRecords, skipDuplicates: true });
  for (let i = 0; i < barangayRecords.length; i += CHUNK_SIZE) {
    const chunk = barangayRecords.slice(i, i + CHUNK_SIZE);
    await prisma.$transaction(
      chunk.map((b) =>
        prisma.phBarangay.update({
          where: { code: b.code },
          data: { name: b.name, municipalityCode: b.municipalityCode },
        })
      )
    );
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
