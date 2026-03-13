import type { TemplateVariableSchema, ArrayOfObjectsVariableInfo } from "./document-template-schema";
import { getTemplateVariableSchema } from "./document-template-schema";

// ---------------------------------------------------------------------------
// Meaningful sample values — the single source of truth for preview data.
// When a variable name in a schema matches a key here it gets a realistic
// value; otherwise a generic placeholder is generated from the variable type.
// ---------------------------------------------------------------------------

const SAMPLE_MEDICINES = [
  {
    index: 1,
    name: "Amoxicillin",
    dosage: "500 mg",
    unit: "capsules",
    qty: 21,
    sig: "Take 1 capsule 3x a day for 7 days",
    label: "Amoxicillin 500 mg #21",
  },
  {
    index: 2,
    name: "Paracetamol",
    dosage: "500 mg",
    unit: "tablets",
    qty: 10,
    sig: "Take 1 tablet as needed for fever or pain",
    label: "Paracetamol 500 mg #10",
  },
];

/**
 * Lookup table of realistic sample values keyed by variable name.
 * Consumed by `buildSampleDataFromSchema` to populate each document type's
 * preview with meaningful values instead of bare placeholders.
 */
const SAMPLE_VALUE_LOOKUP: Record<string, unknown> = {
  // Patient identity
  name: "Juan dela Cruz",
  patientName: "Juan dela Cruz",
  age: "35 years old",
  gender: "M",
  sex: "Male",
  dob: "01/15/1990",
  birthdate: "01/15/1990",
  address: "123 Rizal St., Poblacion, Makati City",

  // Provider
  doctorName: "Dr. Maria A. Santos",
  licenseNo: "0123456",
  ptrNo: "7654321",
  doctorAddress: "ABC Medical Clinic, 456 Ayala Ave., Makati City",
  referredBy: "Dr. Maria A. Santos",

  // Dates
  date: "03/13/2026",
  requestDate: "03/13/2026",
  createdDate: "03/13/2026",
  createdDateTime: "March 13, 2026 9:00 AM",

  // Prescription
  medicines: SAMPLE_MEDICINES,
  medicine: SAMPLE_MEDICINES.map((m) => `${m.index}.) ${m.label}<br/>Sig: ${m.sig}`).join("<br/><br/>"),
  eSignatureUrl: "",

  // Medical certificate
  selectedClassification: "Fit to Work",
  selectedClassificationDescription: "Patient is medically fit to resume work duties.",
  selectedReason: "Annual medical check-up",
  selectedFinding: "No significant findings. BP 120/80 mmHg. Heart sounds normal.",
  recommendations: "Continue current medications. Follow-up in 3 months.",
  impression: "Hypertensive, controlled. Generally healthy.",

  // Referral
  referredToSpecialty: "Cardiology",
  chiefComplaint: "Chest pain and shortness of breath on exertion for 2 weeks",
  briefHistory: "Patient has a 5-year history of hypertension, managed with Amlodipine 5mg OD.",
  recommendation: "Refer for echocardiogram and treadmill stress test.",
  reasonForReferral: "Rule out ischemic heart disease",

  // Diagnostics
  diagnostics: "12-lead ECG, Chest X-ray",
  history: "Hypertension for 5 years. No previous cardiac workup.",
  requestFor: "R/O Ischemic Heart Disease",

  // Lab arrays (new — schema-driven)
  hematology: ["CBC", "Platelet Count", "Blood Typing"],
  clinicalMicroscopy: ["Urinalysis", "Fecalysis"],
  bloodChemistry: ["FBS", "HbA1c", "Lipid Profile", "BUN", "Creatinine"],
  microbiology: ["Sputum AFB"],
  hormoneAssays: ["TSH", "FT4"],
  cardiacDiagnostics: ["12-lead ECG", "2D Echo"],

  // Lab legacy HTML (backward compat)
  hematologyTests: "<strong>CBC, Platelet Count, Blood Typing</strong>",
  clinicalMicroscopyTests: "<strong>Urinalysis, Fecalysis</strong>",
  bloodChemistryTests: "<strong>FBS, HbA1c, Lipid Profile, BUN, Creatinine</strong>",
  microbiologyTests: "<strong>Sputum AFB</strong>",
  hormoneAssaysTests: "<strong>TSH, FT4</strong>",
  cardiacDiagnosticsTests: "<strong>12-lead ECG, 2D Echo</strong>",
};

// ---------------------------------------------------------------------------
// Dynamic sample data builder
// ---------------------------------------------------------------------------

/**
 * Builds a sample-data context for preview rendering by walking the schema's
 * variable list and resolving each entry against `SAMPLE_VALUE_LOOKUP`.
 *
 * - Scalar variables: use lookup value, or fall back to `[variableName]`
 * - `array-of-strings` variables: use lookup array, or generate a two-item placeholder
 * - `array-of-objects` variables: use lookup array, or generate one mock item whose
 *   properties are derived from the schema's `properties` list
 *
 * This means adding a new variable to a schema's `TEMPLATE_VARIABLE_SCHEMA`
 * automatically makes it available in the preview — no changes to this file needed.
 */
export function buildSampleDataFromSchema(schema: TemplateVariableSchema): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  const placeholder = (name: string) => `[${name}]`;

  for (const v of schema.variables) {
    if (Object.hasOwn(SAMPLE_VALUE_LOOKUP, v.variable)) {
      // Prefer the realistic lookup value
      data[v.variable] = SAMPLE_VALUE_LOOKUP[v.variable];
      continue;
    }

    // Generate a fallback based on the variable type
    if (v.type === "array-of-strings") {
      data[v.variable] = [`${v.variable} item 1`, `${v.variable} item 2`];
    } else if (v.type === "array-of-objects") {
      const info = v as ArrayOfObjectsVariableInfo;
      const mockItem: Record<string, unknown> = {};
      for (const prop of info.properties) {
        mockItem[prop.variable] = Object.hasOwn(SAMPLE_VALUE_LOOKUP, prop.variable)
          ? SAMPLE_VALUE_LOOKUP[prop.variable]
          : placeholder(prop.variable);
      }
      data[v.variable] = [mockItem];
    } else {
      data[v.variable] = placeholder(v.variable);
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/**
 * Serialises a sample value to a string for simple regex-based preview
 * substitution. Arrays are flattened to readable text so scalar
 * `{{ variable }}` references produce output even when the author intended
 * a for-loop.
 */
function sampleValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      return (value as Array<Record<string, unknown>>)
        .map((item) => String(item.label ?? item.name ?? JSON.stringify(item)))
        .join("; ");
    }
    return (value as unknown[]).map(String).join(", ");
  }
  return String(value ?? "");
}

/**
 * Renders a template with sample data for live preview purposes.
 *
 * The data context is **derived from the document type's schema** via
 * `buildSampleDataFromSchema`, ensuring that every variable declared in the
 * schema is represented in the preview automatically. Known variables receive
 * realistic values from `SAMPLE_VALUE_LOOKUP`; unknown ones get a labelled
 * placeholder.
 *
 * Uses simple regex substitution (no full Liquid engine) so it is safe to
 * call from client-side React components without bundling the server-side
 * Liquid dependency. Note: `{% for %}` blocks are not expanded — authors
 * should switch to the Preview Sheet to verify looping logic.
 */
export function renderPreviewTemplate(
  template: string,
  documentTypeName: string | null | undefined
): string {
  if (!template.trim()) return "";

  // Resolve schema for the given document type using the shared lookup
  const schema = documentTypeName ? getTemplateVariableSchema(documentTypeName) : null;

  // Build context: schema-derived sample data, with fallback for any schema-less preview
  const context: Record<string, unknown> = schema
    ? buildSampleDataFromSchema(schema)
    : { ...SAMPLE_VALUE_LOOKUP };

  // Replace {{ variable }}, {{- variable -}}, and legacy @{variable}
  return template
    .replace(/@\{(\w+)\}/g, (_, key: string) =>
      key in context ? sampleValueToString(context[key]) : `[${key}]`
    )
    .replace(/\{\{-?\s*(\w+)\s*-?\}\}/g, (_, key: string) =>
      key in context ? sampleValueToString(context[key]) : `[${key}]`
    );
}
