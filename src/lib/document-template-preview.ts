import type { TemplateVariableSchema, ArrayOfObjectsVariableInfo } from "./document-template-schema";
import { getTemplateVariableSchema } from "./document-template-schema";
import { renderLiquidTemplate } from "./liquid-template";

// ---------------------------------------------------------------------------
// Meaningful sample values — the single source of truth for preview data.
// When a variable name in a schema matches a key here it gets a realistic
// value; otherwise a generic placeholder is generated from the variable type.
// ---------------------------------------------------------------------------

const SAMPLE_MEDICINES = [
  { index: 1,  name: "Amoxicillin",        dosage: "500 mg",  unit: "capsules", qty: 21, sig: "Take 1 capsule 3x a day for 7 days",                   label: "Amoxicillin 500 mg #21" },
  { index: 2,  name: "Paracetamol",        dosage: "500 mg",  unit: "tablets",  qty: 10, sig: "Take 1 tablet every 4-6 hours as needed for fever",     label: "Paracetamol 500 mg #10" },
  { index: 3,  name: "Amlodipine",         dosage: "5 mg",    unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily",                              label: "Amlodipine 5 mg #30" },
  { index: 4,  name: "Metformin",          dosage: "500 mg",  unit: "tablets",  qty: 60, sig: "Take 1 tablet twice daily with meals",                  label: "Metformin 500 mg #60" },
  { index: 5,  name: "Atorvastatin",       dosage: "20 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet at bedtime",                              label: "Atorvastatin 20 mg #30" },
  { index: 6,  name: "Losartan",           dosage: "50 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily",                              label: "Losartan 50 mg #30" },
  { index: 7,  name: "Omeprazole",         dosage: "20 mg",   unit: "capsules", qty: 30, sig: "Take 1 capsule 30 minutes before breakfast",             label: "Omeprazole 20 mg #30" },
  { index: 8,  name: "Salbutamol",         dosage: "2 mg",    unit: "tablets",  qty: 30, sig: "Take 1 tablet 3x a day as needed",                      label: "Salbutamol 2 mg #30" },
  { index: 9,  name: "Cetirizine",         dosage: "10 mg",   unit: "tablets",  qty: 14, sig: "Take 1 tablet once daily at night",                     label: "Cetirizine 10 mg #14" },
  { index: 10, name: "Ascorbic Acid",      dosage: "500 mg",  unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily",                              label: "Ascorbic Acid 500 mg #30" },
  { index: 11, name: "Ibuprofen",          dosage: "400 mg",  unit: "tablets",  qty: 15, sig: "Take 1 tablet 3x a day after meals",                    label: "Ibuprofen 400 mg #15" },
  { index: 12, name: "Multivitamins",      dosage: "1 tablet", unit: "tablets", qty: 30, sig: "Take 1 tablet once daily",                              label: "Multivitamins #30" },
  { index: 13, name: "Metoprolol",         dosage: "50 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet twice daily",                             label: "Metoprolol 50 mg #30" },
  { index: 14, name: "Furosemide",         dosage: "40 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily in the morning",               label: "Furosemide 40 mg #30" },
  { index: 15, name: "Spironolactone",     dosage: "25 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily",                              label: "Spironolactone 25 mg #30" },
  { index: 16, name: "Aspirin",            dosage: "80 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily after breakfast",              label: "Aspirin 80 mg #30" },
  { index: 17, name: "Clopidogrel",        dosage: "75 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily",                              label: "Clopidogrel 75 mg #30" },
  { index: 18, name: "Montelukast",        dosage: "10 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet once daily at bedtime",                   label: "Montelukast 10 mg #30" },
  { index: 19, name: "Domperidone",        dosage: "10 mg",   unit: "tablets",  qty: 30, sig: "Take 1 tablet 3x a day 30 minutes before meals",        label: "Domperidone 10 mg #30" },
  { index: 20, name: "Vitamin D3",         dosage: "1000 IU", unit: "capsules", qty: 30, sig: "Take 1 capsule once daily with meals",                  label: "Vitamin D3 1000 IU #30" },
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

  // `diagnostics` is intentionally absent from this shared lookup because the type differs
  // per schema: heart station / imaging declare it as array-of-strings, laboratory as
  // array-of-objects. buildSampleDataFromSchema generates the correct structure for each.
  // `tests` is a nested property of laboratory's diagnostics objects — providing a realistic
  // array here ensures inner {% for test in group.tests %} loops render correctly in the preview.
  tests: ["CBC", "Platelet Count", "Urinalysis"],

  // Imaging diagnosticItems — each entry carries a procedure name, the body part to image,
  // and any special technologist instructions for that study.
  diagnosticItems: [
    { name: "X-RAY", bodyPart: "Chest (PA view)", notes: "Patient must remove all metallic objects. Full deep inspiration required during exposure." },
    { name: "ULTRASOUND", bodyPart: "Whole Abdomen", notes: "NPO for at least 6 hours prior to examination. Full bladder required." },
    { name: "MRI", bodyPart: "Left Knee", notes: "Inform radiologic technologist of any metallic implants, pacemakers, or claustrophobia." },
  ],
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
 * Renders a template with sample data for live preview purposes.
 *
 * The data context is **derived from the document type's schema** via
 * `buildSampleDataFromSchema`, ensuring that every variable declared in the
 * schema is represented in the preview automatically. Known variables receive
 * realistic values from `SAMPLE_VALUE_LOOKUP`; unknown ones get a labelled
 * placeholder.
 *
 * Uses the LiquidJS engine so that `{% for %}` loops and all other Liquid
 * tags are fully expanded, giving an accurate preview of the rendered output.
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

  return renderLiquidTemplate(template, context);
}
