"use server";

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import prisma from "@lib/prisma";
import {
  KONSULTA_SAMPLE_LIBRARY_DEFINITIONS,
  parseKonsultaLibraryWorkbookBuffer,
  type KonsultaLibraryDefinition,
  type KonsultaParsedRow,
  type KonsultaParsedSheet,
} from "@/lib/konsulta-library";

export type KonsultaLibraryDomainDefinition = {
  domainKey: string;
  fileName: string;
  title: string;
  category: string;
};

export type ClinicKonsultaLibraryDomainSummary = {
  domainKey: string;
  title: string;
  category: string;
  philHealthReferenceCount: number;
  clinicItemCount: number;
  mappedCount: number;
  unmappedCount: number;
  needsReviewCount: number;
  customItemCount: number;
  seededItemCount: number;
  bootstrapStatus: "READY" | "MISSING";
};

export type ClinicKonsultaLibrarySummary = {
  clinicId: number;
  domains: ClinicKonsultaLibraryDomainSummary[];
  totals: {
    philHealthReferenceCount: number;
    clinicItemCount: number;
    mappedCount: number;
    unmappedCount: number;
    needsReviewCount: number;
    missingDomains: number;
  };
};

export type ClinicKonsultaTermRecord = {
  id: number;
  domainKey: string;
  title: string;
  internalCode: string | null;
  displayLabel: string;
  sourceType: string;
  mappingStatus: string;
  mappedReferenceId: number | null;
  mappedReferenceCode: string | null;
  mappedReferenceLabel: string | null;
};

export type PhilHealthKonsultaReferenceOption = {
  id: number;
  externalCode: string | null;
  displayLabel: string;
  title: string;
  domainKey: string;
};

export type ClinicKonsultaTermSuggestion = {
  id: number;
  domainKey: string;
  domainTitle: string;
  displayLabel: string;
  internalCode: string | null;
  sourceType: string;
  mappingStatus: string;
  mappedReferenceCode: string | null;
  mappedReferenceLabel: string | null;
};

type ParsedReferenceRow = {
  domainKey: string;
  title: string;
  category: string;
  sourceFileName: string;
  sheetName: string;
  rowSignature: string;
  externalCode: string | null;
  displayLabel: string;
  normalizedCode: string | null;
  normalizedLabel: string;
  libraryStatus: string | null;
  metadata: Prisma.InputJsonValue | Prisma.JsonNullValueInput;
  rawRow: Prisma.InputJsonValue | Prisma.JsonNullValueInput;
  isActive: boolean;
};

type DiagnosisMappingResult = {
  consultationId: number;
  diagnosisId: number;
  icd10Code: string;
  description: string;
  mappedCode: string | null;
};

const KONSULTA_LIBRARY_BASE_DIR =
  process.env.KONSULTA_LIBRARY_BASE_DIR?.trim() ||
  path.join(process.cwd(), "_Konsulta Development Kit v1.1", "LIBRARIES");

function toDomainKey(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim().toLowerCase();
}

function normalizeLibraryText(value: string | null | undefined): string | null {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
}

function toDisplayString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function toNestedJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toNestedJsonValue(entry));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const jsonObject: Record<
    string,
    Prisma.InputJsonValue | null
  > = {};
  for (const [key, entry] of Object.entries(value)) {
    jsonObject[key] = toNestedJsonValue(entry);
  }
  return jsonObject;
}

function toJsonValue(
  value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  return toNestedJsonValue(value) ?? Prisma.JsonNull;
}

function isLibraryRowActive(status: string | null): boolean {
  if (!status) {
    return true;
  }

  const normalized = status.trim().toLowerCase();
  if (["0", "inactive", "deactivated"].some((value) => normalized.includes(value))) {
    return false;
  }

  return true;
}

function getColumnValue(
  row: KonsultaParsedRow,
  headers: string[],
  preferredHeaders: string[],
): string | null {
  for (const preferredHeader of preferredHeaders) {
    const value = row[preferredHeader];
    const displayValue = toDisplayString(value);
    if (displayValue) {
      return displayValue;
    }
  }

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase();
    if (
      preferredHeaders.some(
        (preferredHeader) =>
          normalizedHeader === preferredHeader.toLowerCase() ||
          normalizedHeader.includes(preferredHeader.toLowerCase()),
      )
    ) {
      const displayValue = toDisplayString(row[header]);
      if (displayValue) {
        return displayValue;
      }
    }
  }

  return null;
}

function extractReferenceRows(
  definition: KonsultaLibraryDefinition,
  sheet: KonsultaParsedSheet,
): ParsedReferenceRow[] {
  const codeHeaders = [
    ...sheet.analysis.keyColumns,
    "ICD Code",
    "DIAGNOSTIC ID",
    "MANAGEMENT ID",
    "MDISEASE CODE",
    "SYMPTOMS ID",
    "IMM CODE",
    "Drug Code",
    "GENERIC CODE",
    "Salt Code",
    "Form Code",
    "Strength Code",
    "Unit Code",
    "Package Code",
  ];
  const labelHeaders = [
    ...sheet.analysis.descriptionColumns,
    "ICD Description",
    "DIAGNOSTIC DESCRIPTION",
    "MANAGEMENT DESCRIPTION",
    "MDISEASE DESCRIPTION",
    "SYMPTOMS DESCRIPTION",
    "IMM DESCRIPTION",
    "Drug Description",
    "GENERIC DESCRIPTION",
    "Salt Description",
    "Form Description",
    "Strength Description",
    "Unit Description",
    "Package Description",
    "ABDOMEN DESCRIPTION",
    "CHEST DESCRIPTION",
    "HEENT DESCRIPTION",
    "HEART DESCRIPTION",
    "GENITOURINARY DESCRIPTION",
    "DIGITAL RECTAL DESCRIPTION",
    "NEURO DESCRIPTION",
    "SKIN AND EXTREMITIES DESCRIPTION",
    "OBSERVATION DESCRIPTION",
    "FINDINGS DESCRIPTION",
    "DESCRIPTION",
  ];
  const statusHeaders = [...sheet.analysis.statusColumns, "LIBRARY STATUS"];

  return sheet.rows.flatMap((row) => {
    const externalCode = getColumnValue(row, sheet.headers, codeHeaders);
    const displayLabel =
      getColumnValue(row, sheet.headers, labelHeaders) ?? externalCode;
    const libraryStatus = getColumnValue(row, sheet.headers, statusHeaders);

    if (!displayLabel) {
      return [];
    }

    const normalizedCode = normalizeLibraryText(externalCode);
    const normalizedLabel = normalizeLibraryText(displayLabel);
    if (!normalizedLabel) {
      return [];
    }

    return [
      {
        domainKey: toDomainKey(definition.fileName),
        title: definition.title,
        category: definition.category,
        sourceFileName: definition.fileName,
        sheetName: sheet.sheetName,
        rowSignature: [
          toDomainKey(definition.fileName),
          sheet.sheetName,
          normalizedCode ?? "no-code",
          normalizedLabel,
        ].join("::"),
        externalCode,
        displayLabel,
        normalizedCode,
        normalizedLabel,
        libraryStatus,
        metadata: toJsonValue({
          headers: sheet.headers,
          analysis: sheet.analysis,
          warnings: sheet.warnings,
        }),
        rawRow: toJsonValue(row),
        isActive: isLibraryRowActive(libraryStatus),
      },
    ];
  });
}

export const KONSULTA_XML_LIBRARY_DOMAINS: KonsultaLibraryDomainDefinition[] =
  KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.map((definition) => ({
    domainKey: toDomainKey(definition.fileName),
    fileName: definition.fileName,
    title: definition.title,
    category: definition.category,
  }));

export function getKonsultaLibraryDomainDefinition(
  domainKey: string,
): KonsultaLibraryDomainDefinition | null {
  return (
    KONSULTA_XML_LIBRARY_DOMAINS.find(
      (definition) => definition.domainKey === domainKey,
    ) ?? null
  );
}

const KONSULTA_DOMAIN_KEYS = {
  icd: toDomainKey("lib_icd.xlsx"),
  diagnostics: toDomainKey("lib_diagnostic.xlsx"),
  management: toDomainKey("lib_management.xlsx"),
  monitoredDiseases: toDomainKey("lib_mdiseases.xlsx"),
  symptoms: toDomainKey("lib_signs_symptoms.xlsx"),
  abdomen: toDomainKey("lib_abdomen.xlsx"),
  chest: toDomainKey("lib_chest.xlsx"),
  digitalRectal: toDomainKey("lib_digital_rectal.xlsx"),
  genitourinary: toDomainKey("lib_genitourinary.xlsx"),
  heart: toDomainKey("lib_heart.xlsx"),
  heent: toDomainKey("lib_heent.xlsx"),
  neuro: toDomainKey("lib_neuro.xlsx"),
  skinExtremities: toDomainKey("lib_skin_extremities.xlsx"),
  immChild: toDomainKey("lib_immchild.xlsx"),
  immYoungWomen: toDomainKey("lib_immyoungw.xlsx"),
  immPregnantWomen: toDomainKey("lib_immpregw.xlsx"),
  immElderly: toDomainKey("lib_immelderly.xlsx"),
  medicine: toDomainKey("lib_medicine.xlsx"),
  medicineGeneric: toDomainKey("lib_medicine_generic.xlsx"),
  medicineSalt: toDomainKey("lib_medicine_salt.xlsx"),
  medicineForm: toDomainKey("lib_medicine_form.xlsx"),
  medicineStrength: toDomainKey("lib_medicine_strength.xlsx"),
  medicineUnit: toDomainKey("lib_medicine_unit.xlsx"),
  medicinePackage: toDomainKey("lib_medicine_package.xlsx"),
} as const;

const KONSULTA_OPTIONAL_DOMAIN_GROUPS = {
  diagnostics: [KONSULTA_DOMAIN_KEYS.diagnostics],
  management: [KONSULTA_DOMAIN_KEYS.management],
  medicalHistory: [KONSULTA_DOMAIN_KEYS.monitoredDiseases],
  peFindings: [
    KONSULTA_DOMAIN_KEYS.abdomen,
    KONSULTA_DOMAIN_KEYS.chest,
    KONSULTA_DOMAIN_KEYS.digitalRectal,
    KONSULTA_DOMAIN_KEYS.genitourinary,
    KONSULTA_DOMAIN_KEYS.heart,
    KONSULTA_DOMAIN_KEYS.heent,
    KONSULTA_DOMAIN_KEYS.neuro,
    KONSULTA_DOMAIN_KEYS.skinExtremities,
  ],
  immunizations: [
    KONSULTA_DOMAIN_KEYS.immChild,
    KONSULTA_DOMAIN_KEYS.immYoungWomen,
    KONSULTA_DOMAIN_KEYS.immPregnantWomen,
    KONSULTA_DOMAIN_KEYS.immElderly,
  ],
  medicines: [
    KONSULTA_DOMAIN_KEYS.medicine,
    KONSULTA_DOMAIN_KEYS.medicineGeneric,
    KONSULTA_DOMAIN_KEYS.medicineSalt,
    KONSULTA_DOMAIN_KEYS.medicineForm,
    KONSULTA_DOMAIN_KEYS.medicineStrength,
    KONSULTA_DOMAIN_KEYS.medicineUnit,
    KONSULTA_DOMAIN_KEYS.medicinePackage,
  ],
} as const;

const PE_SECTION_DOMAIN_MAP: Record<string, string> = {
  abdomen: KONSULTA_DOMAIN_KEYS.abdomen,
  chest: KONSULTA_DOMAIN_KEYS.chest,
  "digital rectal": KONSULTA_DOMAIN_KEYS.digitalRectal,
  rectal: KONSULTA_DOMAIN_KEYS.digitalRectal,
  gu: KONSULTA_DOMAIN_KEYS.genitourinary,
  genitourinary: KONSULTA_DOMAIN_KEYS.genitourinary,
  heart: KONSULTA_DOMAIN_KEYS.heart,
  heent: KONSULTA_DOMAIN_KEYS.heent,
  neuro: KONSULTA_DOMAIN_KEYS.neuro,
  skin: KONSULTA_DOMAIN_KEYS.skinExtremities,
  "skin extremities": KONSULTA_DOMAIN_KEYS.skinExtremities,
  "skin_extremities": KONSULTA_DOMAIN_KEYS.skinExtremities,
};

type ReferenceSyncSummary = {
  created: number;
  updated: number;
  retired: number;
  total: number;
};

type ResolvedMappedTerm = {
  termId: number | null;
  domainKey: string | null;
  inputValue: string;
  internalCode: string | null;
  internalLabel: string | null;
  mappingStatus: string;
  mappedReferenceId: number | null;
  mappedCode: string | null;
  mappedLabel: string | null;
};

type ResolveInput = {
  domainKeys: readonly string[];
  value: string;
  contextLabel: string;
  reportMissingTerm?: boolean;
};

type MappedConsultationCode = {
  consultationId: number;
  inputValue: string;
  mappedCode: string | null;
};

type MappedPatientCode = {
  patientUserId: number;
  inputValue: string;
  mappedCode: string | null;
  domainKey: string | null;
};

function normalizeSectionName(section: string): string {
  return section.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function tokenizeMappedValues(value: string): string[] {
  return value
    .split(/[\n,;]+/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function pushUniqueMappedCode(
  map: Map<number, string[]>,
  key: number,
  nextCode: string | null,
): void {
  if (!nextCode) {
    return;
  }

  const existing = map.get(key) ?? [];
  if (!existing.includes(nextCode)) {
    existing.push(nextCode);
    map.set(key, existing);
  }
}

async function refreshPhilHealthReferenceMappingsStatus(): Promise<void> {
  await prisma.clinicKonsultaTermMapping.updateMany({
    where: {
      PhilHealthReferenceItem: {
        isActive: false,
      },
    },
    data: {
      mappingStatus: "NEEDS_REVIEW",
    },
  });
}

export async function refreshPhilHealthKonsultaReferenceLibrary(): Promise<ReferenceSyncSummary> {
  let created = 0;
  let updated = 0;
  let total = 0;
  const seenRowSignaturesByFile = new Map<string, string[]>();

  for (const definition of KONSULTA_SAMPLE_LIBRARY_DEFINITIONS) {
    const filePath = path.join(KONSULTA_LIBRARY_BASE_DIR, definition.fileName);
    const fileBuffer = await fs.readFile(filePath);
    const parsedWorkbook = parseKonsultaLibraryWorkbookBuffer(
      definition.fileName,
      fileBuffer,
    );
    const rows = parsedWorkbook.sheets.flatMap((sheet) =>
      extractReferenceRows(definition, sheet),
    );

    total += rows.length;

    seenRowSignaturesByFile.set(
      definition.fileName,
      rows.map((row) => row.rowSignature),
    );

    for (const row of rows) {
      const existing = await prisma.philHealthKonsultaReference.findUnique({
        where: {
          rowSignature: row.rowSignature,
        },
        select: {
          id: true,
        },
      });

      await prisma.philHealthKonsultaReference.upsert({
        where: {
          rowSignature: row.rowSignature,
        },
        create: row,
        update: {
          title: row.title,
          category: row.category,
          sourceFileName: row.sourceFileName,
          sheetName: row.sheetName,
          externalCode: row.externalCode,
          displayLabel: row.displayLabel,
          normalizedCode: row.normalizedCode,
          normalizedLabel: row.normalizedLabel,
          libraryStatus: row.libraryStatus,
          metadata: row.metadata,
          rawRow: row.rawRow,
          isActive: row.isActive,
        },
      });

      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
    }
  }

  let retired = 0;
  for (const definition of KONSULTA_SAMPLE_LIBRARY_DEFINITIONS) {
    const seenRowSignatures = seenRowSignaturesByFile.get(definition.fileName) ?? [];
    const retiredResult = await prisma.philHealthKonsultaReference.updateMany({
      where: {
        sourceFileName: definition.fileName,
        rowSignature: {
          notIn: seenRowSignatures,
        },
      },
      data: {
        isActive: false,
        libraryStatus: "RETIRED",
      },
    });
    retired += retiredResult.count;
  }

  await refreshPhilHealthReferenceMappingsStatus();

  return {
    created,
    updated,
    retired,
    total,
  };
}

export async function ensurePhilHealthKonsultaReferenceLibrary(): Promise<{
  created: number;
  total: number;
}> {
  const result = await refreshPhilHealthKonsultaReferenceLibrary();
  return {
    created: result.created,
    total: result.total,
  };
}

export async function bootstrapClinicKonsultaLibraries(
  clinicId: number,
): Promise<{
  createdItems: number;
  createdMappings: number;
}> {
  await ensurePhilHealthKonsultaReferenceLibrary();

  const references = await prisma.philHealthKonsultaReference.findMany({
    where: {
      domainKey: { in: KONSULTA_XML_LIBRARY_DOMAINS.map((domain) => domain.domainKey) },
    },
    select: {
      id: true,
      domainKey: true,
      title: true,
      externalCode: true,
      displayLabel: true,
      normalizedCode: true,
      normalizedLabel: true,
    },
  });

  const existingSeededItems = await prisma.clinicKonsultaTerm.findMany({
    where: {
      clinicId,
      seededFromReferenceId: {
        in: references.map((reference) => reference.id),
      },
    },
    select: {
      id: true,
      seededFromReferenceId: true,
    },
  });

  const existingSeededReferenceIds = new Set(
    existingSeededItems
      .map((item) => item.seededFromReferenceId)
      .filter((value): value is number => value !== null),
  );

  const itemsToCreate = references
    .filter((reference) => !existingSeededReferenceIds.has(reference.id))
    .map((reference) => ({
      clinicId,
      domainKey: reference.domainKey,
      title: reference.title,
      internalCode: reference.externalCode,
      displayLabel: reference.displayLabel,
      normalizedCode: reference.normalizedCode,
      normalizedLabel: reference.normalizedLabel,
      sourceType: "SEEDED",
      seededFromReferenceId: reference.id,
      isActive: true,
    }));

  let createdItems = 0;
  if (itemsToCreate.length > 0) {
    const result = await prisma.clinicKonsultaTerm.createMany({
      data: itemsToCreate,
      skipDuplicates: true,
    });
    createdItems = result.count;
  }

  const seededItems = await prisma.clinicKonsultaTerm.findMany({
    where: {
      clinicId,
      seededFromReferenceId: {
        in: references.map((reference) => reference.id),
      },
    },
    select: {
      id: true,
      seededFromReferenceId: true,
    },
  });

  const existingMappings = await prisma.clinicKonsultaTermMapping.findMany({
    where: {
      clinicLibraryItemId: { in: seededItems.map((item) => item.id) },
    },
    select: {
      clinicLibraryItemId: true,
    },
  });

  const existingMappedItemIds = new Set(
    existingMappings.map((mapping) => mapping.clinicLibraryItemId),
  );

  const mappingsToCreate = seededItems
    .filter((item) => !existingMappedItemIds.has(item.id))
    .map((item) => ({
      clinicLibraryItemId: item.id,
      philHealthReferenceItemId: item.seededFromReferenceId ?? null,
      mappingStatus: item.seededFromReferenceId ? "MAPPED" : "UNMAPPED",
      mappedAt: item.seededFromReferenceId ? new Date() : null,
    }));

  let createdMappings = 0;
  if (mappingsToCreate.length > 0) {
    const result = await prisma.clinicKonsultaTermMapping.createMany({
      data: mappingsToCreate,
      skipDuplicates: true,
    });
    createdMappings = result.count;
  }

  return { createdItems, createdMappings };
}

export async function getClinicKonsultaLibrarySummary(
  clinicId: number,
): Promise<ClinicKonsultaLibrarySummary> {
  await bootstrapClinicKonsultaLibraries(clinicId);

  const [referenceItems, clinicItems] = await Promise.all([
    prisma.philHealthKonsultaReference.findMany({
      where: {
        domainKey: { in: KONSULTA_XML_LIBRARY_DOMAINS.map((domain) => domain.domainKey) },
      },
      select: {
        domainKey: true,
      },
    }),
    prisma.clinicKonsultaTerm.findMany({
      where: {
        clinicId,
        domainKey: { in: KONSULTA_XML_LIBRARY_DOMAINS.map((domain) => domain.domainKey) },
      },
      select: {
        domainKey: true,
        sourceType: true,
        Mapping: {
          select: {
            mappingStatus: true,
          },
        },
      },
    }),
  ]);

  const referenceCounts = new Map<string, number>();
  for (const item of referenceItems) {
    referenceCounts.set(item.domainKey, (referenceCounts.get(item.domainKey) ?? 0) + 1);
  }

  const clinicMetrics = new Map<
    string,
    {
      clinicItemCount: number;
      mappedCount: number;
      unmappedCount: number;
      needsReviewCount: number;
      customItemCount: number;
      seededItemCount: number;
    }
  >();

  for (const item of clinicItems) {
    const metric =
      clinicMetrics.get(item.domainKey) ?? {
        clinicItemCount: 0,
        mappedCount: 0,
        unmappedCount: 0,
        needsReviewCount: 0,
        customItemCount: 0,
        seededItemCount: 0,
      };

    metric.clinicItemCount += 1;
    if (item.sourceType === "CUSTOM") {
      metric.customItemCount += 1;
    }
    if (item.sourceType === "SEEDED") {
      metric.seededItemCount += 1;
    }

    const status = item.Mapping?.mappingStatus ?? "UNMAPPED";
    if (status === "MAPPED") {
      metric.mappedCount += 1;
    } else if (status === "NEEDS_REVIEW") {
      metric.needsReviewCount += 1;
    } else {
      metric.unmappedCount += 1;
    }

    clinicMetrics.set(item.domainKey, metric);
  }

  const domains = KONSULTA_XML_LIBRARY_DOMAINS.map((domain) => {
    const metric =
      clinicMetrics.get(domain.domainKey) ?? {
        clinicItemCount: 0,
        mappedCount: 0,
        unmappedCount: 0,
        needsReviewCount: 0,
        customItemCount: 0,
        seededItemCount: 0,
      };

    return {
      domainKey: domain.domainKey,
      title: domain.title,
      category: domain.category,
      philHealthReferenceCount: referenceCounts.get(domain.domainKey) ?? 0,
      clinicItemCount: metric.clinicItemCount,
      mappedCount: metric.mappedCount,
      unmappedCount: metric.unmappedCount,
      needsReviewCount: metric.needsReviewCount,
      customItemCount: metric.customItemCount,
      seededItemCount: metric.seededItemCount,
      bootstrapStatus: metric.clinicItemCount > 0 ? "READY" : "MISSING",
    } satisfies ClinicKonsultaLibraryDomainSummary;
  });

  return {
    clinicId,
    domains,
    totals: {
      philHealthReferenceCount: domains.reduce(
        (count, domain) => count + domain.philHealthReferenceCount,
        0,
      ),
      clinicItemCount: domains.reduce(
        (count, domain) => count + domain.clinicItemCount,
        0,
      ),
      mappedCount: domains.reduce((count, domain) => count + domain.mappedCount, 0),
      unmappedCount: domains.reduce(
        (count, domain) => count + domain.unmappedCount,
        0,
      ),
      needsReviewCount: domains.reduce(
        (count, domain) => count + domain.needsReviewCount,
        0,
      ),
      missingDomains: domains.filter((domain) => domain.bootstrapStatus === "MISSING")
        .length,
    },
  };
}

export async function searchClinicKonsultaTermSuggestions(
  clinicId: number,
  domainKeys: string[],
  query = "",
): Promise<ClinicKonsultaTermSuggestion[]> {
  if (domainKeys.length === 0) {
    return [];
  }

  await bootstrapClinicKonsultaLibraries(clinicId);
  const normalizedQuery = normalizeLibraryText(query);

  const items = await prisma.clinicKonsultaTerm.findMany({
    where: {
      clinicId,
      domainKey: { in: domainKeys },
      isActive: true,
      ...(normalizedQuery
        ? {
            OR: [
              { normalizedLabel: { contains: normalizedQuery } },
              { normalizedCode: { contains: normalizedQuery } },
              { displayLabel: { contains: query.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ sourceType: "asc" }, { displayLabel: "asc" }],
    take: 25,
    select: {
      id: true,
      domainKey: true,
      displayLabel: true,
      internalCode: true,
      sourceType: true,
      Mapping: {
        select: {
          mappingStatus: true,
          PhilHealthReferenceItem: {
            select: {
              externalCode: true,
              displayLabel: true,
            },
          },
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    domainKey: item.domainKey,
    domainTitle:
      getKonsultaLibraryDomainDefinition(item.domainKey)?.title ?? item.domainKey,
    displayLabel: item.displayLabel,
    internalCode: item.internalCode,
    sourceType: item.sourceType,
    mappingStatus: item.Mapping?.mappingStatus ?? "UNMAPPED",
    mappedReferenceCode:
      item.Mapping?.PhilHealthReferenceItem?.externalCode ?? null,
    mappedReferenceLabel:
      item.Mapping?.PhilHealthReferenceItem?.displayLabel ?? null,
  }));
}

export async function getClinicKonsultaLibraryDomainItems(
  clinicId: number,
  domainKey: string,
  query = "",
): Promise<ClinicKonsultaTermRecord[]> {
  await bootstrapClinicKonsultaLibraries(clinicId);
  const normalizedQuery = normalizeLibraryText(query);

  const items = await prisma.clinicKonsultaTerm.findMany({
    where: {
      clinicId,
      domainKey,
      ...(normalizedQuery
        ? {
            OR: [
              { normalizedLabel: { contains: normalizedQuery } },
              { normalizedCode: { contains: normalizedQuery } },
            ],
          }
        : {}),
    },
    orderBy: [
      { sourceType: "asc" },
      { displayLabel: "asc" },
    ],
    take: 50,
    select: {
      id: true,
      domainKey: true,
      title: true,
      internalCode: true,
      displayLabel: true,
      sourceType: true,
      Mapping: {
        select: {
          mappingStatus: true,
          philHealthReferenceItemId: true,
          PhilHealthReferenceItem: {
            select: {
              externalCode: true,
              displayLabel: true,
            },
          },
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    domainKey: item.domainKey,
    title: item.title,
    internalCode: item.internalCode,
    displayLabel: item.displayLabel,
    sourceType: item.sourceType,
    mappingStatus: item.Mapping?.mappingStatus ?? "UNMAPPED",
    mappedReferenceId: item.Mapping?.philHealthReferenceItemId ?? null,
    mappedReferenceCode: item.Mapping?.PhilHealthReferenceItem?.externalCode ?? null,
    mappedReferenceLabel:
      item.Mapping?.PhilHealthReferenceItem?.displayLabel ?? null,
  }));
}

export async function searchPhilHealthKonsultaReferenceItems(
  domainKey: string,
  query: string,
): Promise<PhilHealthKonsultaReferenceOption[]> {
  await ensurePhilHealthKonsultaReferenceLibrary();
  const normalizedQuery = normalizeLibraryText(query);

  const references = await prisma.philHealthKonsultaReference.findMany({
    where: {
      domainKey,
      ...(normalizedQuery
        ? {
            OR: [
              { normalizedLabel: { contains: normalizedQuery } },
              { normalizedCode: { contains: normalizedQuery } },
            ],
          }
        : {}),
    },
    orderBy: [{ displayLabel: "asc" }],
    take: 25,
    select: {
      id: true,
      externalCode: true,
      displayLabel: true,
      title: true,
      domainKey: true,
    },
  });

  return references;
}

export async function createClinicKonsultaCustomLibraryItem(
  clinicId: number,
  domainKey: string,
  internalCode: string | null,
  displayLabel: string,
): Promise<void> {
  const normalizedLabel = normalizeLibraryText(displayLabel);
  if (!normalizedLabel) {
    throw new Error("Internal library label is required.");
  }

  const normalizedCode = normalizeLibraryText(internalCode);

  const item = await prisma.clinicKonsultaTerm.create({
    data: {
      clinicId,
      domainKey,
      title: getKonsultaLibraryDomainDefinition(domainKey)?.title ?? domainKey,
      internalCode: internalCode?.trim() || null,
      displayLabel: displayLabel.trim(),
      normalizedCode,
      normalizedLabel,
      sourceType: "CUSTOM",
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  await prisma.clinicKonsultaTermMapping.create({
    data: {
      clinicLibraryItemId: item.id,
      mappingStatus: "UNMAPPED",
    },
  });
}

export async function updateClinicKonsultaTermMapping(
  clinicItemId: number,
  philHealthReferenceItemId: number | null,
): Promise<void> {
  await prisma.clinicKonsultaTermMapping.upsert({
    where: {
      clinicLibraryItemId: clinicItemId,
    },
    create: {
      clinicLibraryItemId: clinicItemId,
      philHealthReferenceItemId,
      mappingStatus: philHealthReferenceItemId ? "MAPPED" : "UNMAPPED",
      mappedAt: philHealthReferenceItemId ? new Date() : null,
    },
    update: {
      philHealthReferenceItemId,
      mappingStatus: philHealthReferenceItemId ? "MAPPED" : "UNMAPPED",
      mappedAt: philHealthReferenceItemId ? new Date() : null,
    },
  });
}

async function resolveMappedTerms(
  clinicId: number,
  inputs: ResolveInput[],
): Promise<{
  resolvedTerms: ResolvedMappedTerm[];
  deficiencies: string[];
}> {
  const validInputs = inputs.filter((input) => input.value.trim().length > 0);
  if (validInputs.length === 0) {
    return {
      resolvedTerms: [],
      deficiencies: [],
    };
  }

  await bootstrapClinicKonsultaLibraries(clinicId);

  const normalizedValues = Array.from(
    new Set(
      validInputs
        .flatMap((input) => [normalizeLibraryText(input.value)])
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const domainKeys = Array.from(
    new Set(validInputs.flatMap((input) => input.domainKeys)),
  );

  const terms = await prisma.clinicKonsultaTerm.findMany({
    where: {
      clinicId,
      domainKey: { in: domainKeys },
      OR: [
        { normalizedCode: { in: normalizedValues } },
        { normalizedLabel: { in: normalizedValues } },
      ],
    },
    select: {
      id: true,
      domainKey: true,
      internalCode: true,
      normalizedCode: true,
      normalizedLabel: true,
      displayLabel: true,
      Mapping: {
        select: {
          mappingStatus: true,
          philHealthReferenceItemId: true,
          PhilHealthReferenceItem: {
            select: {
              externalCode: true,
              displayLabel: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  const groupedByCode = new Map<string, typeof terms>();
  const groupedByLabel = new Map<string, typeof terms>();
  for (const term of terms) {
    if (term.normalizedCode) {
      groupedByCode.set(term.normalizedCode, [
        ...(groupedByCode.get(term.normalizedCode) ?? []),
        term,
      ]);
    }

    if (term.normalizedLabel) {
      groupedByLabel.set(term.normalizedLabel, [
        ...(groupedByLabel.get(term.normalizedLabel) ?? []),
        term,
      ]);
    }
  }

  const pickBestMatch = (matches: typeof terms): (typeof terms)[number] | null => {
    if (matches.length === 0) {
      return null;
    }

    return (
      matches.find(
        (term) =>
          term.Mapping?.mappingStatus === "MAPPED" &&
          term.Mapping.PhilHealthReferenceItem?.isActive,
      ) ??
      matches.find((term) => term.Mapping?.mappingStatus === "NEEDS_REVIEW") ??
      matches[0] ??
      null
    );
  };

  const deficiencies: string[] = [];
  const resolvedTerms = validInputs.map((input) => {
    const normalizedValue = normalizeLibraryText(input.value);
    const matches = normalizedValue
      ? [
          ...(groupedByCode.get(normalizedValue) ?? []),
          ...(groupedByLabel.get(normalizedValue) ?? []),
        ].filter((term, index, allTerms) =>
          allTerms.findIndex((candidate) => candidate.id === term.id) === index,
        )
      : [];
    const matchedTerm = pickBestMatch(matches);
    const mappedReference =
      matchedTerm?.Mapping?.mappingStatus === "MAPPED" &&
      matchedTerm.Mapping.PhilHealthReferenceItem?.isActive
        ? matchedTerm.Mapping.PhilHealthReferenceItem
        : null;

    if (!mappedReference && (input.reportMissingTerm ?? true)) {
      deficiencies.push(
        matchedTerm
          ? `${input.contextLabel} exists in clinic terms but is not mapped to an active PhilHealth reference yet.`
          : `${input.contextLabel} is not present in the clinic internal terms yet, so it cannot be exported to PhilHealth XML.`,
      );
    }

    return {
      termId: matchedTerm?.id ?? null,
      domainKey: matchedTerm?.domainKey ?? null,
      inputValue: input.value,
      internalCode: matchedTerm?.internalCode ?? null,
      internalLabel: matchedTerm?.displayLabel ?? null,
      mappingStatus: matchedTerm?.Mapping?.mappingStatus ?? "UNMAPPED",
      mappedReferenceId:
        matchedTerm?.Mapping?.philHealthReferenceItemId ?? null,
      mappedCode: mappedReference?.externalCode ?? null,
      mappedLabel: mappedReference?.displayLabel ?? null,
    } satisfies ResolvedMappedTerm;
  });

  return {
    resolvedTerms,
    deficiencies,
  };
}

export async function resolveMappedIcdCodesForConsultations(
  clinicId: number,
  consultationIds: number[],
): Promise<{
  mappedDiagnoses: DiagnosisMappingResult[];
  deficiencies: string[];
}> {
  if (consultationIds.length === 0) {
    return { mappedDiagnoses: [], deficiencies: [] };
  }

  const diagnoses = await prisma.consultationDiagnosis.findMany({
    where: {
      consultationTicketId: { in: consultationIds },
    },
    select: {
      id: true,
      consultationTicketId: true,
      icd10Code: true,
      description: true,
    },
  });

  const result = await resolveMappedTerms(
    clinicId,
    diagnoses.map((diagnosis) => ({
      domainKeys: [KONSULTA_DOMAIN_KEYS.icd],
      value: diagnosis.icd10Code || diagnosis.description,
      contextLabel: `Consultation ${diagnosis.consultationTicketId}: diagnosis ${diagnosis.icd10Code} (${diagnosis.description})`,
      reportMissingTerm: true,
    })),
  );

  return {
    mappedDiagnoses: diagnoses.map((diagnosis, index) => ({
      consultationId: diagnosis.consultationTicketId,
      diagnosisId: diagnosis.id,
      icd10Code: diagnosis.icd10Code,
      description: diagnosis.description,
      mappedCode: result.resolvedTerms[index]?.mappedCode ?? null,
    })),
    deficiencies: result.deficiencies,
  };
}

export async function resolveMappedDiagnosticsForConsultations(
  clinicId: number,
  consultationIds: number[],
): Promise<{
  mappedDiagnostics: MappedConsultationCode[];
  deficiencies: string[];
}> {
  if (consultationIds.length === 0) {
    return { mappedDiagnostics: [], deficiencies: [] };
  }

  const [laboratoryRequests, imagingRequests, heartStationRequests] =
    await Promise.all([
      prisma.clinicLaboratoryRequest.findMany({
        where: {
          consultationTicketId: { in: consultationIds },
          isActive: true,
          deletedAt: null,
        },
        select: {
          consultationTicketId: true,
          LaboratoryRequestProcedures: {
            select: {
              LaboratoryProcedure: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.clinicImagingRequest.findMany({
        where: {
          consultationTicketId: { in: consultationIds },
          isActive: true,
          deletedAt: null,
        },
        select: {
          consultationTicketId: true,
          ImagingRequestProcedures: {
            select: {
              ImagingProcedure: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.clinicHeartStationRequest.findMany({
        where: {
          consultationTicketId: { in: consultationIds },
          isActive: true,
          deletedAt: null,
        },
        select: {
          consultationTicketId: true,
          HeartStationRequestProcedures: {
            select: {
              HeartStationProcedure: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const diagnosticInputs: Array<ResolveInput & { consultationId: number }> = [];

  for (const request of laboratoryRequests) {
    for (const procedure of request.LaboratoryRequestProcedures) {
      diagnosticInputs.push({
        consultationId: request.consultationTicketId,
        domainKeys: KONSULTA_OPTIONAL_DOMAIN_GROUPS.diagnostics,
        value: procedure.LaboratoryProcedure.name,
        contextLabel: `Consultation ${request.consultationTicketId}: diagnostic ${procedure.LaboratoryProcedure.name}`,
        reportMissingTerm: true,
      });
    }
  }

  for (const request of imagingRequests) {
    for (const procedure of request.ImagingRequestProcedures) {
      diagnosticInputs.push({
        consultationId: request.consultationTicketId,
        domainKeys: KONSULTA_OPTIONAL_DOMAIN_GROUPS.diagnostics,
        value: procedure.ImagingProcedure.name,
        contextLabel: `Consultation ${request.consultationTicketId}: diagnostic ${procedure.ImagingProcedure.name}`,
        reportMissingTerm: true,
      });
    }
  }

  for (const request of heartStationRequests) {
    for (const procedure of request.HeartStationRequestProcedures) {
      diagnosticInputs.push({
        consultationId: request.consultationTicketId,
        domainKeys: KONSULTA_OPTIONAL_DOMAIN_GROUPS.diagnostics,
        value: procedure.HeartStationProcedure.name,
        contextLabel: `Consultation ${request.consultationTicketId}: diagnostic ${procedure.HeartStationProcedure.name}`,
        reportMissingTerm: true,
      });
    }
  }

  const result = await resolveMappedTerms(clinicId, diagnosticInputs);

  return {
    mappedDiagnostics: diagnosticInputs.map((input, index) => ({
      consultationId: input.consultationId,
      inputValue: input.value,
      mappedCode: result.resolvedTerms[index]?.mappedCode ?? null,
    })),
    deficiencies: result.deficiencies,
  };
}

export async function resolveMappedManagementForConsultations(
  clinicId: number,
  consultationIds: number[],
): Promise<{
  mappedManagements: MappedConsultationCode[];
  deficiencies: string[];
}> {
  if (consultationIds.length === 0) {
    return { mappedManagements: [], deficiencies: [] };
  }

  const interventions = await prisma.intervention.findMany({
    where: {
      consultationTicketId: { in: consultationIds },
      isActive: true,
      deletedAt: null,
    },
    select: {
      consultationTicketId: true,
      Action: {
        select: {
          name: true,
        },
      },
    },
  });

  const managementInputs = interventions.map((intervention) => ({
    consultationId: intervention.consultationTicketId,
    domainKeys: KONSULTA_OPTIONAL_DOMAIN_GROUPS.management,
    value: intervention.Action.name,
    contextLabel: `Consultation ${intervention.consultationTicketId}: management ${intervention.Action.name}`,
    reportMissingTerm: true,
  }));
  const result = await resolveMappedTerms(clinicId, managementInputs);

  return {
    mappedManagements: managementInputs.map((input, index) => ({
      consultationId: input.consultationId,
      inputValue: input.value,
      mappedCode: result.resolvedTerms[index]?.mappedCode ?? null,
    })),
    deficiencies: result.deficiencies,
  };
}

export async function resolveMappedMedicalHistoryForPatients(
  clinicId: number,
  patientUserIds: number[],
): Promise<{
  mappedMedicalHistory: MappedPatientCode[];
  deficiencies: string[];
}> {
  if (patientUserIds.length === 0) {
    return { mappedMedicalHistory: [], deficiencies: [] };
  }

  const histories = await prisma.medicalHistory.findMany({
    where: {
      userId: { in: patientUserIds },
    },
    select: {
      userId: true,
      Condition: {
        select: {
          name: true,
        },
      },
    },
  });

  const inputs = histories.map((history) => ({
    patientUserId: history.userId,
    domainKeys: KONSULTA_OPTIONAL_DOMAIN_GROUPS.medicalHistory,
    value: history.Condition.name,
    contextLabel: `Patient ${history.userId}: medical history ${history.Condition.name}`,
    reportMissingTerm: true,
  }));
  const result = await resolveMappedTerms(clinicId, inputs);

  return {
    mappedMedicalHistory: inputs.map((input, index) => ({
      patientUserId: input.patientUserId,
      inputValue: input.value,
      mappedCode: result.resolvedTerms[index]?.mappedCode ?? null,
      domainKey: result.resolvedTerms[index]?.domainKey ?? null,
    })),
    deficiencies: result.deficiencies,
  };
}

export async function resolveMappedImmunizationsForPatients(
  clinicId: number,
  patientUserIds: number[],
): Promise<{
  mappedImmunizations: MappedPatientCode[];
  deficiencies: string[];
}> {
  if (patientUserIds.length === 0) {
    return { mappedImmunizations: [], deficiencies: [] };
  }

  const vaccinations = await prisma.userVaccination.findMany({
    where: {
      userId: { in: patientUserIds },
      isActive: true,
      deletedAt: null,
    },
    select: {
      userId: true,
      Vaccine: {
        select: {
          name: true,
        },
      },
    },
  });

  const inputs = vaccinations.map((vaccination) => ({
    patientUserId: vaccination.userId,
    domainKeys: KONSULTA_OPTIONAL_DOMAIN_GROUPS.immunizations,
    value: vaccination.Vaccine.name,
    contextLabel: `Patient ${vaccination.userId}: immunization ${vaccination.Vaccine.name}`,
    reportMissingTerm: true,
  }));
  const result = await resolveMappedTerms(clinicId, inputs);

  return {
    mappedImmunizations: inputs.map((input, index) => ({
      patientUserId: input.patientUserId,
      inputValue: input.value,
      mappedCode: result.resolvedTerms[index]?.mappedCode ?? null,
      domainKey: result.resolvedTerms[index]?.domainKey ?? null,
    })),
    deficiencies: result.deficiencies,
  };
}

export async function resolveMappedPhysicalExamFindingsForConsultations(
  clinicId: number,
  consultationIds: number[],
): Promise<{
  mappedFindings: Array<MappedConsultationCode & { domainKey: string | null }>;
  deficiencies: string[];
}> {
  if (consultationIds.length === 0) {
    return { mappedFindings: [], deficiencies: [] };
  }

  const notes = await prisma.consultationNote.findMany({
    where: {
      consultationTicketId: { in: consultationIds },
      section: {
        in: Object.keys(PE_SECTION_DOMAIN_MAP),
      },
    },
    select: {
      consultationTicketId: true,
      section: true,
      content: true,
    },
  });

  const inputs: Array<ResolveInput & { consultationId: number }> = [];
  for (const note of notes) {
    const domainKey = PE_SECTION_DOMAIN_MAP[normalizeSectionName(note.section)];
    if (!domainKey) {
      continue;
    }

    for (const token of tokenizeMappedValues(note.content)) {
      inputs.push({
        consultationId: note.consultationTicketId,
        domainKeys: [domainKey],
        value: token,
        contextLabel: `Consultation ${note.consultationTicketId}: PE finding ${token}`,
        reportMissingTerm: false,
      });
    }
  }

  const result = await resolveMappedTerms(clinicId, inputs);

  return {
    mappedFindings: inputs.map((input, index) => ({
      consultationId: input.consultationId,
      inputValue: input.value,
      mappedCode: result.resolvedTerms[index]?.mappedCode ?? null,
      domainKey: result.resolvedTerms[index]?.domainKey ?? null,
    })),
    deficiencies: result.deficiencies,
  };
}

export async function resolveMappedMedicinesForConsultations(
  clinicId: number,
  consultationIds: number[],
): Promise<{
  mappedMedicines: Array<{
    consultationId: number;
    sourceName: string;
    mappedDrugCode: string | null;
    mappedGenericCode: string | null;
    dosage: string | null;
    frequency: string | null;
    unit: string | null;
    quantity: number | null;
    notes: string | null;
  }>;
  deficiencies: string[];
}> {
  if (consultationIds.length === 0) {
    return { mappedMedicines: [], deficiencies: [] };
  }

  const [prescriptionMedicines, medicationDrugs] = await Promise.all([
    prisma.prescription.findMany({
      where: {
        consultationTicketId: { in: consultationIds },
        isActive: true,
        isArchived: false,
      },
      select: {
        consultationTicketId: true,
        Medicines: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          select: {
            name: true,
            genericName: true,
            brandName: true,
            dosage: true,
            frequency: true,
            unit: true,
            qty: true,
            notes: true,
          },
        },
      },
    }),
    prisma.medication.findMany({
      where: {
        consultationTicketId: { in: consultationIds },
        completedAt: null,
      },
      select: {
        consultationTicketId: true,
        MedicationDrugs: {
          select: {
            dosage: true,
            frequency: true,
            unit: true,
            duration: true,
            notes: true,
            Drug: {
              select: {
                brandName: true,
                genericName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const medicineRows: Array<{
    consultationId: number;
    lookupName: string;
    lookupGeneric: string | null;
    dosage: string | null;
    frequency: string | null;
    unit: string | null;
    quantity: number | null;
    notes: string | null;
  }> = [];

  for (const prescription of prescriptionMedicines) {
    for (const medicine of prescription.Medicines) {
      medicineRows.push({
        consultationId: prescription.consultationTicketId,
        lookupName: medicine.name || medicine.brandName || medicine.genericName || "",
        lookupGeneric: medicine.genericName ?? null,
        dosage: medicine.dosage ?? null,
        frequency: medicine.frequency ?? null,
        unit: medicine.unit ?? null,
        quantity: medicine.qty ?? null,
        notes: medicine.notes ?? null,
      });
    }
  }

  for (const medication of medicationDrugs) {
    for (const medicationDrug of medication.MedicationDrugs) {
      medicineRows.push({
        consultationId: medication.consultationTicketId,
        lookupName:
          medicationDrug.Drug.brandName || medicationDrug.Drug.genericName || "",
        lookupGeneric: medicationDrug.Drug.genericName ?? null,
        dosage: medicationDrug.dosage ?? null,
        frequency: medicationDrug.frequency ?? null,
        unit: medicationDrug.unit ?? null,
        quantity: medicationDrug.duration ?? null,
        notes: medicationDrug.notes ?? null,
      });
    }
  }

  const drugCodeResult = await resolveMappedTerms(
    clinicId,
    medicineRows.map((medicine) => ({
      domainKeys: [KONSULTA_DOMAIN_KEYS.medicine],
      value: medicine.lookupName,
      contextLabel: `Consultation ${medicine.consultationId}: medicine ${medicine.lookupName}`,
      reportMissingTerm: false,
    })),
  );
  const genericCodeResult = await resolveMappedTerms(
    clinicId,
    medicineRows
      .filter((medicine) => medicine.lookupGeneric)
      .map((medicine) => ({
        domainKeys: [KONSULTA_DOMAIN_KEYS.medicineGeneric],
        value: medicine.lookupGeneric ?? "",
        contextLabel: `Consultation ${medicine.consultationId}: medicine generic ${medicine.lookupGeneric}`,
        reportMissingTerm: false,
      })),
  );

  const genericCodeByKey = new Map<string, string | null>();
  medicineRows
    .filter((medicine) => medicine.lookupGeneric)
    .forEach((medicine, index) => {
      genericCodeByKey.set(
        `${medicine.consultationId}::${medicine.lookupGeneric}`,
        genericCodeResult.resolvedTerms[index]?.mappedCode ?? null,
      );
    });

  const deficiencies = Array.from(
    new Set(
      [
        ...drugCodeResult.deficiencies,
        ...genericCodeResult.deficiencies,
        ...medicineRows
          .filter((medicine, index) => {
            const hasDrugCode =
              drugCodeResult.resolvedTerms[index]?.mappedCode !== null;
            const hasGenericCode = medicine.lookupGeneric
              ? genericCodeByKey.get(
                  `${medicine.consultationId}::${medicine.lookupGeneric}`,
                ) !== null
              : false;
            return !hasDrugCode && !hasGenericCode;
          })
          .map(
            (medicine) =>
              `Consultation ${medicine.consultationId}: medicine ${medicine.lookupName} is not mapped to a PhilHealth medicine reference yet.`,
          ),
      ],
    ),
  );

  return {
    mappedMedicines: medicineRows.map((medicine, index) => ({
      consultationId: medicine.consultationId,
      sourceName: medicine.lookupName,
      mappedDrugCode: drugCodeResult.resolvedTerms[index]?.mappedCode ?? null,
      mappedGenericCode: medicine.lookupGeneric
        ? genericCodeByKey.get(
            `${medicine.consultationId}::${medicine.lookupGeneric}`,
          ) ?? null
        : null,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      unit: medicine.unit,
      quantity: medicine.quantity,
      notes: medicine.notes,
    })),
    deficiencies,
  };
}
