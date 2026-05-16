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

export type ClinicKonsultaLibraryItemRecord = {
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

const KONSULTA_LIBRARY_BASE_DIR = path.join(
  process.cwd(),
  "_Konsulta Development Kit v1.1",
  "LIBRARIES",
);

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

export async function ensurePhilHealthKonsultaReferenceLibrary(): Promise<{
  created: number;
  total: number;
}> {
  let created = 0;
  let total = 0;

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

    if (rows.length === 0) {
      continue;
    }

    const result = await prisma.philHealthKonsultaLibraryItem.createMany({
      data: rows,
      skipDuplicates: true,
    });
    created += result.count;
  }

  return { created, total };
}

export async function bootstrapClinicKonsultaLibraries(
  clinicId: number,
): Promise<{
  createdItems: number;
  createdMappings: number;
}> {
  await ensurePhilHealthKonsultaReferenceLibrary();

  const references = await prisma.philHealthKonsultaLibraryItem.findMany({
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

  const existingSeededItems = await prisma.clinicKonsultaLibraryItem.findMany({
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
    const result = await prisma.clinicKonsultaLibraryItem.createMany({
      data: itemsToCreate,
      skipDuplicates: true,
    });
    createdItems = result.count;
  }

  const seededItems = await prisma.clinicKonsultaLibraryItem.findMany({
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

  const existingMappings = await prisma.clinicKonsultaLibraryMapping.findMany({
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
    const result = await prisma.clinicKonsultaLibraryMapping.createMany({
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
    prisma.philHealthKonsultaLibraryItem.findMany({
      where: {
        domainKey: { in: KONSULTA_XML_LIBRARY_DOMAINS.map((domain) => domain.domainKey) },
      },
      select: {
        domainKey: true,
      },
    }),
    prisma.clinicKonsultaLibraryItem.findMany({
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

export async function getClinicKonsultaLibraryDomainItems(
  clinicId: number,
  domainKey: string,
  query = "",
): Promise<ClinicKonsultaLibraryItemRecord[]> {
  await bootstrapClinicKonsultaLibraries(clinicId);
  const normalizedQuery = normalizeLibraryText(query);

  const items = await prisma.clinicKonsultaLibraryItem.findMany({
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

  const references = await prisma.philHealthKonsultaLibraryItem.findMany({
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

  const item = await prisma.clinicKonsultaLibraryItem.create({
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

  await prisma.clinicKonsultaLibraryMapping.create({
    data: {
      clinicLibraryItemId: item.id,
      mappingStatus: "UNMAPPED",
    },
  });
}

export async function updateClinicKonsultaLibraryMapping(
  clinicItemId: number,
  philHealthReferenceItemId: number | null,
): Promise<void> {
  await prisma.clinicKonsultaLibraryMapping.upsert({
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

  await bootstrapClinicKonsultaLibraries(clinicId);
  const icdDomainKey = toDomainKey("lib_icd.xlsx");

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

  if (diagnoses.length === 0) {
    return { mappedDiagnoses: [], deficiencies: [] };
  }

  const normalizedCodes = Array.from(
    new Set(
      diagnoses
        .map((diagnosis) => normalizeLibraryText(diagnosis.icd10Code))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const normalizedLabels = Array.from(
    new Set(
      diagnoses
        .map((diagnosis) => normalizeLibraryText(diagnosis.description))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const libraryItems = await prisma.clinicKonsultaLibraryItem.findMany({
    where: {
      clinicId,
      domainKey: icdDomainKey,
      OR: [
        { normalizedCode: { in: normalizedCodes } },
        { normalizedLabel: { in: normalizedLabels } },
      ],
    },
    select: {
      id: true,
      normalizedCode: true,
      normalizedLabel: true,
      displayLabel: true,
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

  const byCode = new Map<string, (typeof libraryItems)[number]>();
  const byLabel = new Map<string, (typeof libraryItems)[number]>();
  for (const item of libraryItems) {
    if (item.normalizedCode && !byCode.has(item.normalizedCode)) {
      byCode.set(item.normalizedCode, item);
    }
    if (item.normalizedLabel && !byLabel.has(item.normalizedLabel)) {
      byLabel.set(item.normalizedLabel, item);
    }
  }

  const deficiencies: string[] = [];
  const mappedDiagnoses = diagnoses.map((diagnosis) => {
    const codeKey = normalizeLibraryText(diagnosis.icd10Code);
    const labelKey = normalizeLibraryText(diagnosis.description);
    const matchedItem =
      (codeKey ? byCode.get(codeKey) : undefined) ??
      (labelKey ? byLabel.get(labelKey) : undefined);
    const mappedCode =
      matchedItem?.Mapping?.mappingStatus === "MAPPED"
        ? matchedItem.Mapping.PhilHealthReferenceItem?.externalCode ?? null
        : null;

    if (!mappedCode) {
      deficiencies.push(
        `Consultation ${diagnosis.consultationTicketId}: diagnosis ${diagnosis.icd10Code} (${diagnosis.description}) is not mapped to a PhilHealth ICD reference.`,
      );
    }

    return {
      consultationId: diagnosis.consultationTicketId,
      diagnosisId: diagnosis.id,
      icd10Code: diagnosis.icd10Code,
      description: diagnosis.description,
      mappedCode,
    };
  });

  return {
    mappedDiagnoses,
    deficiencies,
  };
}
