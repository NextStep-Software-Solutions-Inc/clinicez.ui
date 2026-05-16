import * as XLSX from "xlsx";

export type KonsultaLibraryCategory =
  | "clinical-reference"
  | "physical-exam"
  | "immunization"
  | "medication"
  | "screening";

export type KonsultaSpreadsheetFileType =
  | "xlsx"
  | "xls"
  | "xlsm"
  | "xlsb"
  | "csv"
  | "unknown";

export type KonsultaColumnRole =
  | "code"
  | "description"
  | "status"
  | "group"
  | "measure"
  | "result"
  | "unknown";

export type KonsultaSheetStructure =
  | "lookup-table"
  | "composite-catalog"
  | "questionnaire"
  | "reference-matrix"
  | "multi-column-reference";

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

export interface KonsultaColumnAnalysis {
  header: string;
  normalizedHeader: string;
  role: KonsultaColumnRole;
  sampleValues: KonsultaCellValue[];
}

export interface KonsultaSheetAnalysis {
  structure: KonsultaSheetStructure;
  columns: KonsultaColumnAnalysis[];
  keyColumns: string[];
  descriptionColumns: string[];
  statusColumns: string[];
  notes: string[];
}

export interface KonsultaParsedSheet {
  sheetName: string;
  headers: string[];
  rowCount: number;
  previewRows: KonsultaParsedRow[];
  warnings: string[];
  analysis: KonsultaSheetAnalysis;
}

export interface KonsultaWorkbookAnalysis {
  source: "sample-reference" | "production-upload";
  category: KonsultaLibraryCategory;
  structure: KonsultaSheetStructure;
  title: string;
  summary: string;
  clinicIntegration: string;
  suggestedUsage: string;
  modelingRecommendations: string[];
}

export interface KonsultaParsedWorkbook {
  fileName: string;
  normalizedFileName: string;
  fileType: KonsultaSpreadsheetFileType;
  sampleReference: KonsultaLibraryDefinition | null;
  analysis: KonsultaWorkbookAnalysis;
  sheetCount: number;
  sheets: KonsultaParsedSheet[];
  warnings: string[];
}

const PREVIEW_ROW_LIMIT = 15;

const CATEGORY_LABELS: Record<KonsultaLibraryCategory, string> = {
  "clinical-reference": "Clinical reference",
  "physical-exam": "Physical exam",
  immunization: "Immunization",
  medication: "Medication",
  screening: "Screening",
};

const FILE_TYPE_EXTENSIONS: Record<KonsultaSpreadsheetFileType, string[]> = {
  xlsx: [".xlsx"],
  xls: [".xls"],
  xlsm: [".xlsm"],
  xlsb: [".xlsb"],
  csv: [".csv"],
  unknown: [],
};

const CATEGORY_KEYWORDS: Record<KonsultaLibraryCategory, string[]> = {
  "clinical-reference": [
    "icd",
    "symptom",
    "sign",
    "diagnostic",
    "disease",
    "management",
    "xray",
    "finding",
    "observation",
  ],
  "physical-exam": [
    "abdomen",
    "chest",
    "heart",
    "heent",
    "neuro",
    "skin",
    "extremit",
    "genitourinary",
    "rectal",
  ],
  immunization: ["imm", "vaccine", "vaccination", "preg", "child", "elderly"],
  medication: ["medicine", "med", "drug", "generic", "salt", "strength", "unit", "package", "form"],
  screening: ["zscore", "ncd", "questionnaire", "screen", "risk", "length", "weight"],
};

export const KONSULTA_SAMPLE_LIBRARY_DEFINITIONS: KonsultaLibraryDefinition[] = [
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

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function humanizeFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^lib[_-]?/i, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function detectFileType(fileName: string): KonsultaSpreadsheetFileType {
  const normalizedFileName = normalizeFileName(fileName);

  return (
    (Object.entries(FILE_TYPE_EXTENSIONS) as Array<
      [KonsultaSpreadsheetFileType, string[]]
    >).find(([, extensions]) =>
      extensions.some((extension) => normalizedFileName.endsWith(extension)),
    )?.[0] ?? "unknown"
  );
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
      const suffixNumber = duplicateCount + 1;
      const uniqueHeader = `${baseHeader} (${suffixNumber})`;
      warnings.push(
        `Duplicate header "${baseHeader}" renamed to "${uniqueHeader}".`,
      );
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

function inferColumnRole(normalizedHeader: string): KonsultaColumnRole {
  if (
    normalizedHeader.includes("code") ||
    normalizedHeader.endsWith(" id") ||
    normalizedHeader === "id"
  ) {
    return "code";
  }

  if (
    normalizedHeader.includes("description") ||
    normalizedHeader.includes("desc") ||
    normalizedHeader.includes("finding") ||
    normalizedHeader.includes("observation") ||
    normalizedHeader.includes("question")
  ) {
    return "description";
  }

  if (normalizedHeader.includes("status")) {
    return "status";
  }

  if (
    normalizedHeader.includes("group") ||
    normalizedHeader.includes("header") ||
    normalizedHeader.includes("category")
  ) {
    return "group";
  }

  if (
    normalizedHeader.includes("length") ||
    normalizedHeader.includes("weight") ||
    normalizedHeader.includes("height") ||
    normalizedHeader.includes("age")
  ) {
    return "measure";
  }

  if (normalizedHeader.includes("result")) {
    return "result";
  }

  return "unknown";
}

function uniqueSampleValues(values: KonsultaCellValue[]): KonsultaCellValue[] {
  const uniqueValues: KonsultaCellValue[] = [];
  const seenValues = new Set<string>();

  values.forEach((value) => {
    if (value === null) {
      return;
    }

    const serializedValue = JSON.stringify(value);
    if (!seenValues.has(serializedValue)) {
      seenValues.add(serializedValue);
      uniqueValues.push(value);
    }
  });

  return uniqueValues.slice(0, 3);
}

function inferSheetStructure(
  columns: KonsultaColumnAnalysis[],
): KonsultaSheetStructure {
  const roles = columns.map((column) => column.role);
  const normalizedHeaders = columns.map((column) => column.normalizedHeader);

  if (
    normalizedHeaders.some((header) => header.includes("generic")) &&
    normalizedHeaders.some((header) => header.includes("form")) &&
    normalizedHeaders.some((header) => header.includes("strength"))
  ) {
    return "composite-catalog";
  }

  if (
    roles.includes("group") &&
    roles.includes("description") &&
    normalizedHeaders.some((header) => header.includes("question"))
  ) {
    return "questionnaire";
  }

  if (roles.includes("measure") && roles.includes("result")) {
    return "reference-matrix";
  }

  if (
    roles.includes("code") &&
    roles.includes("description") &&
    columns.length <= 5
  ) {
    return "lookup-table";
  }

  if (
    roles.includes("code") &&
    normalizedHeaders.some((header) => header.includes("generic")) &&
    normalizedHeaders.some((header) => header.includes("package"))
  ) {
    return "composite-catalog";
  }

  return "multi-column-reference";
}

function analyzeSheet(
  headers: string[],
  previewRows: KonsultaParsedRow[],
): KonsultaSheetAnalysis {
  const columns = headers.map((header) => {
    const normalizedHeader = normalizeHeaderKey(header);
    const sampleValues = uniqueSampleValues(
      previewRows.map((row) => row[header] ?? null),
    );

    return {
      header,
      normalizedHeader,
      role: inferColumnRole(normalizedHeader),
      sampleValues,
    };
  });

  const keyColumns = columns
    .filter((column) => column.role === "code")
    .map((column) => column.header);
  const descriptionColumns = columns
    .filter((column) => column.role === "description")
    .map((column) => column.header);
  const statusColumns = columns
    .filter((column) => column.role === "status")
    .map((column) => column.header);

  const notes: string[] = [];
  const structure = inferSheetStructure(columns);

  if (keyColumns.length === 0) {
    notes.push(
      "No obvious code/id column detected. Keep a raw-row JSON fallback during the first persistence design.",
    );
  }

  if (descriptionColumns.length === 0) {
    notes.push(
      "No obvious description column detected. Review whether this sheet is a relationship table or numeric reference matrix.",
    );
  }

  if (statusColumns.length === 0) {
    notes.push(
      "No status column detected. Treat all rows as active unless the production source defines archival rules elsewhere.",
    );
  }

  if (structure === "questionnaire") {
    notes.push(
      "This looks like a grouped questionnaire and likely needs template/section/question modeling instead of a single lookup table.",
    );
  }

  if (structure === "composite-catalog") {
    notes.push(
      "This looks like a catalog assembled from multiple supporting codes and should keep those components separate in future persistence.",
    );
  }

  if (structure === "reference-matrix") {
    notes.push(
      "This looks like a numeric decision matrix keyed by measurement columns and should be modeled as a rule/lookup grid later.",
    );
  }

  return {
    structure,
    columns,
    keyColumns,
    descriptionColumns,
    statusColumns,
    notes,
  };
}

function inferCategoryFromText(text: string): KonsultaLibraryCategory {
  const normalizedText = normalizeHeaderKey(text);

  const bestMatch = (
    Object.entries(CATEGORY_KEYWORDS) as Array<
      [KonsultaLibraryCategory, string[]]
    >
  ).reduce<{
    category: KonsultaLibraryCategory;
    score: number;
  }>(
    (currentBestMatch, [category, keywords]) => {
      const score = keywords.reduce((totalScore, keyword) => {
        return normalizedText.includes(keyword) ? totalScore + 1 : totalScore;
      }, 0);

      if (score > currentBestMatch.score) {
        return { category, score };
      }

      return currentBestMatch;
    },
    { category: "clinical-reference", score: 0 },
  );

  return bestMatch.category;
}

function inferWorkbookCategory(
  fileName: string,
  sheets: KonsultaParsedSheet[],
  sampleReference: KonsultaLibraryDefinition | null,
): KonsultaLibraryCategory {
  if (sampleReference) {
    return sampleReference.category;
  }

  const combinedText = [
    humanizeFileName(fileName),
    ...sheets.flatMap((sheet) => sheet.headers),
    ...sheets.flatMap((sheet) => sheet.analysis.notes),
  ].join(" ");

  return inferCategoryFromText(combinedText);
}

function determineDominantStructure(
  sheets: KonsultaParsedSheet[],
): KonsultaSheetStructure {
  if (sheets.length === 0) {
    return "multi-column-reference";
  }

  const structureCounts = sheets.reduce<Record<KonsultaSheetStructure, number>>(
    (counts, sheet) => {
      counts[sheet.analysis.structure] += 1;
      return counts;
    },
    {
      "lookup-table": 0,
      "composite-catalog": 0,
      questionnaire: 0,
      "reference-matrix": 0,
      "multi-column-reference": 0,
    },
  );

  const structurePriority: KonsultaSheetStructure[] = [
    "composite-catalog",
    "questionnaire",
    "reference-matrix",
    "lookup-table",
    "multi-column-reference",
  ];

  return structurePriority.reduce((dominantStructure, structure) => {
    if (structureCounts[structure] > structureCounts[dominantStructure]) {
      return structure;
    }

    return dominantStructure;
  }, "lookup-table");
}

function getStructureSummary(structure: KonsultaSheetStructure): string {
  switch (structure) {
    case "lookup-table":
      return "This dataset looks like a coded lookup library with descriptions and optional statuses.";
    case "composite-catalog":
      return "This dataset looks like a composite catalog that depends on multiple reusable reference codes.";
    case "questionnaire":
      return "This dataset looks like a questionnaire template with grouped prompts or answers.";
    case "reference-matrix":
      return "This dataset looks like a numeric reference matrix or scoring table.";
    case "multi-column-reference":
      return "This dataset looks like a structured reference table that needs a generic first-pass persistence model.";
  }
}

function getCategoryClinicIntegration(
  category: KonsultaLibraryCategory,
): string {
  switch (category) {
    case "clinical-reference":
      return "Best suited for diagnosis search, signs and symptoms capture, diagnostics ordering, management plans, and PhilHealth report validation.";
    case "physical-exam":
      return "Best suited for structured physical examination sections inside consultations and SOAP-based encounter documentation.";
    case "immunization":
      return "Best suited for immunization history, preventive-care visits, and vaccine-specific encounter forms.";
    case "medication":
      return "Best suited for medication dictionaries, prescription composition, formulary search, and PhilHealth-compatible drug encoding.";
    case "screening":
      return "Best suited for screening questionnaires, growth/nutrition scoring, and preventive-risk workflows.";
  }
}

function getCategorySuggestedUsage(
  category: KonsultaLibraryCategory,
  structure: KonsultaSheetStructure,
): string {
  if (structure === "questionnaire") {
    return "Use the uploaded workbook to finalize questionnaire sections, question prompts, and answer structures before deciding how responses should be stored.";
  }

  if (structure === "reference-matrix") {
    return "Use the uploaded workbook as the source for score/result lookups and validate how clinic calculators should query it before persistence is designed.";
  }

  switch (category) {
    case "clinical-reference":
      return "Use the uploaded production file as the source of truth for clinic-side dropdowns, search, and future PhilHealth validation rules.";
    case "physical-exam":
      return "Use the uploaded production file to standardize structured physical exam choices shown to clinicians.";
    case "immunization":
      return "Use the uploaded production file to drive vaccine pickers and age-group-specific preventive care workflows.";
    case "medication":
      return "Use the uploaded production file to decide whether medication libraries should remain split across supporting reference tables or be flattened for search.";
    case "screening":
      return "Use the uploaded production file to define screening templates and the lookup logic for scores or outcomes.";
  }
}

function getModelingRecommendations(
  structure: KonsultaSheetStructure,
  category: KonsultaLibraryCategory,
  sheets: KonsultaParsedSheet[],
): string[] {
  const sharedRecommendations = [
    "Preserve sourceFile, sheetName, importBatchId, and rawRowJson in the first persistence version so production uploads remain traceable.",
    "Keep PhilHealth external codes separate from internal database IDs so future library refreshes can be reconciled safely.",
  ];

  if (structure === "lookup-table") {
    return [
      ...sharedRecommendations,
      "Start with one generic lookup entity shape: externalCode, label, status, displayOrder, sourceSheet, and metadata JSON for extra columns.",
      `Most sheets in this workbook can likely share a single lookup-table model, then be scoped by category (${CATEGORY_LABELS[category]}).`,
    ];
  }

  if (structure === "composite-catalog") {
    return [
      ...sharedRecommendations,
      "Separate reusable supporting dimensions such as generic, form, strength, unit, or package into their own future entities if production uploads continue to deliver them independently.",
      "Keep a denormalized search projection for admin and clinic lookups even if the canonical future model becomes normalized.",
    ];
  }

  if (structure === "questionnaire") {
    return [
      ...sharedRecommendations,
      "Model this as questionnaireTemplate -> questionnaireSection -> questionnaireItem rather than a flat lookup table.",
      "Store ordering/grouping metadata explicitly so production workbook row order can be reconstructed in clinic forms.",
    ];
  }

  if (structure === "reference-matrix") {
    return [
      ...sharedRecommendations,
      "Model this as a reference-matrix table keyed by measurement columns plus result code/description.",
      `Consider a dedicated evaluation service instead of direct UI lookups because ${sheets.length > 1 ? "the workbook has multiple related sheets" : "the workbook likely drives derived results"}.`,
    ];
  }

  return [
    ...sharedRecommendations,
    "Begin with a generic imported-library row model and only split into specialized tables once production uploads show stable semantics.",
    "Review column-role inference from the preview before locking in the future schema.",
  ];
}

function createWorkbookAnalysis(
  fileName: string,
  sheets: KonsultaParsedSheet[],
  sampleReference: KonsultaLibraryDefinition | null,
): KonsultaWorkbookAnalysis {
  const category = inferWorkbookCategory(fileName, sheets, sampleReference);
  const structure = determineDominantStructure(sheets);

  if (sampleReference) {
    return {
      source: "sample-reference",
      category,
      structure,
      title: sampleReference.title,
      summary: `${sampleReference.description} ${getStructureSummary(structure)}`,
      clinicIntegration: sampleReference.clinicIntegration,
      suggestedUsage: sampleReference.suggestedUsage,
      modelingRecommendations: getModelingRecommendations(structure, category, sheets),
    };
  }

  return {
    source: "production-upload",
    category,
    structure,
    title: humanizeFileName(fileName),
    summary: `${getStructureSummary(structure)} The production filename does not need to match the sample kit names for this preview to work.`,
    clinicIntegration: getCategoryClinicIntegration(category),
    suggestedUsage: getCategorySuggestedUsage(category, structure),
    modelingRecommendations: getModelingRecommendations(structure, category, sheets),
  };
}

function createEmptySheet(sheetName: string, warning: string): KonsultaParsedSheet {
  return {
    sheetName,
    headers: [],
    rowCount: 0,
    previewRows: [],
    warnings: [warning],
    analysis: {
      structure: "multi-column-reference",
      columns: [],
      keyColumns: [],
      descriptionColumns: [],
      statusColumns: [],
      notes: [warning],
    },
  };
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
      analysis: {
        structure: "multi-column-reference",
        columns: [],
        keyColumns: [],
        descriptionColumns: [],
        statusColumns: [],
        notes: ["Sheet is empty and has no header row."],
      },
    };
  }

  const [headerRow, ...dataRows] = normalizedRows;
  const { headers, warnings } = buildHeaders(headerRow);
  const contentRows = dataRows.filter(hasRowContent);
  const previewRows = createPreviewRows(contentRows, headers);

  return {
    sheetName,
    headers,
    rowCount: contentRows.length,
    previewRows,
    warnings,
    analysis: analyzeSheet(headers, previewRows),
  };
}

export function getKonsultaSampleLibraryDefinition(
  fileName: string,
): KonsultaLibraryDefinition | null {
  const normalizedFileName = normalizeFileName(fileName);

  return (
    KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.find(
      (definition) => normalizeFileName(definition.fileName) === normalizedFileName,
    ) ?? null
  );
}

export function getKonsultaCategoryLabel(
  category: KonsultaLibraryCategory,
): string {
  return CATEGORY_LABELS[category];
}

export function getKonsultaStructureLabel(
  structure: KonsultaSheetStructure,
): string {
  switch (structure) {
    case "lookup-table":
      return "Lookup table";
    case "composite-catalog":
      return "Composite catalog";
    case "questionnaire":
      return "Questionnaire";
    case "reference-matrix":
      return "Reference matrix";
    case "multi-column-reference":
      return "Multi-column reference";
  }
}

export function isSupportedKonsultaLibraryFile(fileName: string): boolean {
  return detectFileType(fileName) !== "unknown";
}

export async function parseKonsultaLibraryWorkbook(
  file: File,
): Promise<KonsultaParsedWorkbook> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sampleReference = getKonsultaSampleLibraryDefinition(file.name);
    const warnings: string[] = [];

    if (workbook.SheetNames.length === 0) {
      warnings.push("Workbook has no sheets.");
    }

    const sheets = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        const warning = `Sheet "${sheetName}" could not be loaded from the workbook.`;
        warnings.push(warning);
        return createEmptySheet(sheetName, warning);
      }

      const parsedSheet = parseWorksheet(worksheet, sheetName);

      if (parsedSheet.rowCount === 0) {
        warnings.push(`Sheet "${sheetName}" has no data rows after the header row.`);
      }

      parsedSheet.warnings.forEach((warning) => {
        warnings.push(`Sheet "${sheetName}": ${warning}`);
      });

      parsedSheet.analysis.notes.forEach((note) => {
        if (note.includes("No obvious")) {
          warnings.push(`Sheet "${sheetName}": ${note}`);
        }
      });

      return parsedSheet;
    });

    if (sheets.every((sheet) => sheet.rowCount === 0)) {
      warnings.push("No non-empty rows were parsed from this workbook.");
    }

    return {
      fileName: file.name,
      normalizedFileName: normalizeFileName(file.name),
      fileType: detectFileType(file.name),
      sampleReference,
      analysis: createWorkbookAnalysis(file.name, sheets, sampleReference),
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
