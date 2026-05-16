import * as XLSX from "xlsx";

export type KonsultaLibraryCategory =
  | "clinical-reference"
  | "physical-exam"
  | "immunization"
  | "medication"
  | "screening";

export interface KonsultaLibraryDefinition {
  fileName: string;
  title: string;
  category: KonsultaLibraryCategory;
  description: string;
  clinicIntegration: string;
  suggestedUsage: string;
}

export type KonsultaCellValue = string | number | boolean | null;

export interface KonsultaParsedRow {
  [header: string]: KonsultaCellValue;
}

export interface KonsultaParsedSheet {
  sheetName: string;
  headers: string[];
  rowCount: number;
  previewRows: KonsultaParsedRow[];
  warnings: string[];
}

export interface KonsultaParsedWorkbook {
  fileName: string;
  normalizedFileName: string;
  definition: KonsultaLibraryDefinition | null;
  sheetCount: number;
  sheets: KonsultaParsedSheet[];
  warnings: string[];
}

const PREVIEW_ROW_LIMIT = 15;

export const KONSULTA_LIBRARY_DEFINITIONS: KonsultaLibraryDefinition[] = [
  {
    fileName: "lib_abdomen.xlsx",
    title: "Abdomen Findings",
    category: "physical-exam",
    description: "Standardized abdomen examination findings for Konsulta encounters.",
    clinicIntegration: "Consultation physical examination forms and structured SOAP findings.",
    suggestedUsage: "Populate abdomen exam dropdowns and normalize submitted findings before PhilHealth report generation.",
  },
  {
    fileName: "lib_chest.xlsx",
    title: "Chest Findings",
    category: "physical-exam",
    description: "Chest and breast examination descriptors used during clinical assessment.",
    clinicIntegration: "Consultation notes, PE forms, and findings-to-report mapping.",
    suggestedUsage: "Use as selectable findings for chest exams to keep clinician charting aligned with PhilHealth values.",
  },
  {
    fileName: "lib_chestxray_findings.xlsx",
    title: "Chest X-ray Findings",
    category: "clinical-reference",
    description: "Reference outcomes for chest X-ray interpretation.",
    clinicIntegration: "Imaging result templates and PhilHealth diagnostic reporting.",
    suggestedUsage: "Map radiology results to these codes when encoding chest X-ray findings for Konsulta submissions.",
  },
  {
    fileName: "lib_chestxray_observation.xlsx",
    title: "Chest X-ray Observations",
    category: "clinical-reference",
    description: "Observation qualifiers paired with chest X-ray findings.",
    clinicIntegration: "Imaging workflows, diagnostic report builders, and result review screens.",
    suggestedUsage: "Use alongside chest X-ray findings so observation terms remain consistent across reports and previews.",
  },
  {
    fileName: "lib_diagnostic.xlsx",
    title: "Diagnostic Procedures",
    category: "clinical-reference",
    description: "Supported diagnostic services and procedures for Konsulta transactions.",
    clinicIntegration: "Diagnostics ordering, service catalog management, and PhilHealth claim payload assembly.",
    suggestedUsage: "Use as the source list for requestable diagnostics that appear in Konsulta encounter documentation.",
  },
  {
    fileName: "lib_digital_rectal.xlsx",
    title: "Digital Rectal Findings",
    category: "physical-exam",
    description: "Standard digital rectal exam findings.",
    clinicIntegration: "Adult exam templates and structured physical examination capture.",
    suggestedUsage: "Attach to male adult assessment flows where digital rectal findings need PhilHealth-compatible values.",
  },
  {
    fileName: "lib_genitourinary.xlsx",
    title: "Genitourinary Findings",
    category: "physical-exam",
    description: "Genitourinary examination findings for charting and reporting.",
    clinicIntegration: "Consultation PE sections and structured GU assessment widgets.",
    suggestedUsage: "Use in GU exam dropdowns so encoded findings can later feed Konsulta XML generation safely.",
  },
  {
    fileName: "lib_heart.xlsx",
    title: "Heart Findings",
    category: "physical-exam",
    description: "Cardiac examination descriptors for Konsulta encounters.",
    clinicIntegration: "Physical exam heart section, follow-up templates, and care review forms.",
    suggestedUsage: "Back the heart exam selector with these values to standardize cardiovascular documentation.",
  },
  {
    fileName: "lib_heent.xlsx",
    title: "HEENT Findings",
    category: "physical-exam",
    description: "Head, eyes, ears, nose, and throat examination findings.",
    clinicIntegration: "General consultation PE forms and clinician documentation shortcuts.",
    suggestedUsage: "Use as the source for structured HEENT findings in outpatient and screening consultations.",
  },
  {
    fileName: "lib_icd.xlsx",
    title: "ICD Diagnoses",
    category: "clinical-reference",
    description: "PhilHealth ICD reference list for coded diagnoses.",
    clinicIntegration: "Diagnosis search, assessment encoding, claims, and PhilHealth export validation.",
    suggestedUsage: "Align diagnosis pickers and Konsulta export validation with this list to avoid unsupported codes.",
  },
  {
    fileName: "lib_immchild.xlsx",
    title: "Child Immunizations",
    category: "immunization",
    description: "Child vaccine reference options supported by Konsulta.",
    clinicIntegration: "Vaccination records, pediatric visit forms, and immunization counseling workflows.",
    suggestedUsage: "Populate pediatric immunization selectors and cross-check selected vaccines against PhilHealth-supported values.",
  },
  {
    fileName: "lib_immelderly.xlsx",
    title: "Elderly Immunizations",
    category: "immunization",
    description: "Vaccines relevant to elderly care encounters.",
    clinicIntegration: "Senior care immunization tracking and preventive health planning.",
    suggestedUsage: "Use in geriatric vaccine forms to ensure PhilHealth-compatible reporting for elderly visits.",
  },
  {
    fileName: "lib_immpregw.xlsx",
    title: "Pregnant Women Immunizations",
    category: "immunization",
    description: "Immunization choices for pregnant patients.",
    clinicIntegration: "Prenatal care forms, maternal vaccine documentation, and Konsulta submission prep.",
    suggestedUsage: "Bind prenatal immunization inputs to this library to keep maternal reporting standardized.",
  },
  {
    fileName: "lib_immyoungw.xlsx",
    title: "Young Women Immunizations",
    category: "immunization",
    description: "Vaccination options relevant to adolescent and young adult women.",
    clinicIntegration: "Preventive care visits and vaccine counseling workflows.",
    suggestedUsage: "Use for age-specific vaccine selection where PhilHealth distinguishes the target population.",
  },
  {
    fileName: "lib_management.xlsx",
    title: "Management Plans",
    category: "clinical-reference",
    description: "Standard management and education interventions.",
    clinicIntegration: "Care plan recommendations, discharge instructions, and consultation outcomes.",
    suggestedUsage: "Use as a reusable list of counseling or management interventions after assessment and diagnosis selection.",
  },
  {
    fileName: "lib_mdiseases.xlsx",
    title: "Monitored Diseases",
    category: "clinical-reference",
    description: "Disease groupings and monitored conditions used by Konsulta.",
    clinicIntegration: "Problem lists, chronic disease registries, and history-taking forms.",
    suggestedUsage: "Map these values into disease-history and monitoring sections before adding persistence rules.",
  },
  {
    fileName: "lib_medicine.xlsx",
    title: "Medicine Master",
    category: "medication",
    description: "Composite medicine catalog linking generic, salt, form, strength, unit, and package codes.",
    clinicIntegration: "Medication ordering, formulary search, PhilHealth medication encoding, and prescription assistance.",
    suggestedUsage: "Treat this as the main medicine dictionary once clinic medication workflows are ready for PhilHealth-aligned drug coding.",
  },
  {
    fileName: "lib_medicine_form.xlsx",
    title: "Medicine Forms",
    category: "medication",
    description: "Dosage form reference codes such as capsule, tablet, or solution.",
    clinicIntegration: "Medication master maintenance and prescription composition UI.",
    suggestedUsage: "Use together with the medicine master to resolve or display human-readable dosage forms.",
  },
  {
    fileName: "lib_medicine_generic.xlsx",
    title: "Medicine Generics",
    category: "medication",
    description: "Generic medicine code reference list.",
    clinicIntegration: "Prescription pickers, formulary search, and medicine master normalization.",
    suggestedUsage: "Use as the generic-level reference when building drug lookup and cross-file joins for medicines.",
  },
  {
    fileName: "lib_medicine_package.xlsx",
    title: "Medicine Packages",
    category: "medication",
    description: "Packaging reference values such as bottle, ampule, or blister pack.",
    clinicIntegration: "Medication display labels and structured prescription metadata.",
    suggestedUsage: "Display package details in prescription and medication preview interfaces using these codes.",
  },
  {
    fileName: "lib_medicine_salt.xlsx",
    title: "Medicine Salts",
    category: "medication",
    description: "Salt or chemical component reference values for medicines.",
    clinicIntegration: "Medication composition views and drug reference cross-walks.",
    suggestedUsage: "Use as a supporting dictionary when decomposing medicine entries into reusable medication metadata.",
  },
  {
    fileName: "lib_medicine_strength.xlsx",
    title: "Medicine Strengths",
    category: "medication",
    description: "Strength reference values used by the medicine master catalog.",
    clinicIntegration: "Prescription details, medicine display formatting, and encoded medication exports.",
    suggestedUsage: "Resolve encoded strength values to clinician-friendly labels in prescription and medication review screens.",
  },
  {
    fileName: "lib_medicine_unit.xlsx",
    title: "Medicine Units",
    category: "medication",
    description: "Unit-of-measure reference values for medication strengths and quantities.",
    clinicIntegration: "Prescription formatting and medication details.",
    suggestedUsage: "Combine with strength and package references to render complete medication descriptions consistently.",
  },
  {
    fileName: "lib_ncdq.xlsx",
    title: "NCD Questionnaire",
    category: "screening",
    description: "Non-communicable disease questionnaire headers, items, and grouping metadata.",
    clinicIntegration: "Adult screening questionnaires, intake assessments, and risk-factor dashboards.",
    suggestedUsage: "Translate this workbook into questionnaire sections and answer prompts before persisting responses.",
  },
  {
    fileName: "lib_neuro.xlsx",
    title: "Neurologic Findings",
    category: "physical-exam",
    description: "Neurologic examination findings for structured charting.",
    clinicIntegration: "Consultation PE sections and neurologic review templates.",
    suggestedUsage: "Use as selectable neurologic findings so clinician notes remain compatible with Konsulta reporting.",
  },
  {
    fileName: "lib_signs_symptoms.xlsx",
    title: "Signs and Symptoms",
    category: "clinical-reference",
    description: "Chief complaint and symptom reference list.",
    clinicIntegration: "Chief complaint capture, triage, consultation intake, and diagnosis support.",
    suggestedUsage: "Wire this into symptom selection and history-taking forms to normalize complaint capture across clinics.",
  },
  {
    fileName: "lib_skin_extremities.xlsx",
    title: "Skin and Extremities Findings",
    category: "physical-exam",
    description: "Skin and extremity examination descriptors.",
    clinicIntegration: "Physical examination forms and structured encounter documentation.",
    suggestedUsage: "Use for skin and extremities selectors to support consistent charting and later export mapping.",
  },
  {
    fileName: "lib_zscore.xlsx",
    title: "Growth Z-Score Reference",
    category: "screening",
    description: "Growth reference lookup table for pediatric nutrition and anthropometric screening.",
    clinicIntegration: "Pediatric growth calculators, nutrition assessments, and child wellness dashboards.",
    suggestedUsage: "Use as lookup data for weight-for-length style scoring before adding automated growth interpretation to clinics.",
  },
];

function normalizeCellValue(value: unknown): KonsultaCellValue {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

function normalizeFileName(fileName: string): string {
  return fileName.trim().toLowerCase();
}

function hasRowContent(row: KonsultaCellValue[]): boolean {
  return row.some((cell) => cell !== null);
}

function formatHeaderValue(
  value: KonsultaCellValue,
  columnIndex: number,
): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return `Column ${columnIndex + 1}`;
}

function buildHeaders(headerRow: KonsultaCellValue[]): {
  headers: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const seenHeaders = new Map<string, number>();

  const headers = headerRow.map((value, columnIndex) => {
    const baseHeader = formatHeaderValue(value, columnIndex);
    const duplicateCount = seenHeaders.get(baseHeader) ?? 0;
    seenHeaders.set(baseHeader, duplicateCount + 1);

    if (baseHeader.startsWith("Column ")) {
      warnings.push(
        `Blank header detected in column ${columnIndex + 1}; generated ${baseHeader}.`,
      );
    }

    if (duplicateCount > 0) {
      const uniqueHeader = `${baseHeader} (${duplicateCount + 1})`;
      warnings.push(`Duplicate header "${baseHeader}" renamed to "${uniqueHeader}".`);
      return uniqueHeader;
    }

    return baseHeader;
  });

  return { headers, warnings };
}

function createPreviewRows(
  rows: KonsultaCellValue[][],
  headers: string[],
): KonsultaParsedRow[] {
  return rows.slice(0, PREVIEW_ROW_LIMIT).map((row) =>
    headers.reduce<KonsultaParsedRow>((record, header, columnIndex) => {
      record[header] = row[columnIndex] ?? null;
      return record;
    }, {}),
  );
}

function parseWorksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
): KonsultaParsedSheet {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  });

  const normalizedRows = rawRows.map((row) => row.map(normalizeCellValue));

  if (normalizedRows.length === 0) {
    return {
      sheetName,
      headers: [],
      rowCount: 0,
      previewRows: [],
      warnings: [],
    };
  }

  const [headerRow, ...dataRows] = normalizedRows;
  const { headers, warnings } = buildHeaders(headerRow);
  const contentRows = dataRows.filter(hasRowContent);

  return {
    sheetName,
    headers,
    rowCount: contentRows.length,
    previewRows: createPreviewRows(contentRows, headers),
    warnings,
  };
}

export function getKonsultaLibraryDefinition(
  fileName: string,
): KonsultaLibraryDefinition | null {
  const normalizedFileName = normalizeFileName(fileName);

  return (
    KONSULTA_LIBRARY_DEFINITIONS.find(
      (definition) => normalizeFileName(definition.fileName) === normalizedFileName,
    ) ?? null
  );
}

export async function parseKonsultaLibraryWorkbook(
  file: File,
): Promise<KonsultaParsedWorkbook> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const definition = getKonsultaLibraryDefinition(file.name);
    const warnings: string[] = [];

    const sheets = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        warnings.push(`Sheet "${sheetName}" could not be loaded from the workbook.`);

        return {
          sheetName,
          headers: [],
          rowCount: 0,
          previewRows: [],
          warnings: [`Sheet "${sheetName}" could not be loaded from the workbook.`],
        };
      }

      const parsedSheet = parseWorksheet(worksheet, sheetName);

      if (parsedSheet.rowCount === 0) {
        warnings.push(`Sheet "${sheetName}" has no data rows after the header row.`);
      }

      parsedSheet.warnings.forEach((warning) => {
        warnings.push(`Sheet "${sheetName}": ${warning}`);
      });

      return parsedSheet;
    });

    if (definition === null) {
      warnings.push("File name did not match a known Konsulta library reference.");
    }

    if (sheets.every((sheet) => sheet.rowCount === 0)) {
      warnings.push("No non-empty rows were parsed from this workbook.");
    }

    return {
      fileName: file.name,
      normalizedFileName: normalizeFileName(file.name),
      definition,
      sheetCount: sheets.length,
      sheets,
      warnings,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown workbook parsing error.";

    throw new Error(`Failed to parse ${file.name}: ${message}`);
  }
}
