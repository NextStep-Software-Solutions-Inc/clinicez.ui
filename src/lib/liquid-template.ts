import { Liquid } from "liquidjs";

// Single shared Liquid engine instance
// strictVariables: false — unknown variables render as empty string (same behaviour as old regex approach)
// outputEscape: false — variables are output as raw HTML (required for medicine lists, sig markup, etc.)
const engine = new Liquid({
  strictFilters: false,
  strictVariables: false,
  outputEscape: false,
});

/**
 * Renders a document template string using LiquidJS.
 *
 * Backward-compatible: legacy `@{variable}` placeholders are automatically
 * converted to `{{ variable }}` before rendering so that templates created
 * before the Liquid migration continue to work without modification.
 */
export function renderLiquidTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  // Convert legacy @{variable} → {{ variable }}
  const migratedTemplate = template.replace(/@\{(\w+)\}/g, "{{ $1 }}");
  return engine.parseAndRenderSync(migratedTemplate, variables);
}

// ---------------------------------------------------------------------------
// Sample data for template preview
// ---------------------------------------------------------------------------

/**
 * Realistic sample values used when rendering a live preview of a document
 * template in the editor. Keys match the variable names in
 * DOCUMENT_TEMPLATE_VARIABLES.
 */
export const DOCUMENT_TEMPLATE_SAMPLE_DATA: Record<string, string> = {
  // Patient
  name: "Juan dela Cruz",
  patientName: "Juan dela Cruz",
  age: "35 years old",
  gender: "M",
  sex: "Male",
  dob: "01/15/1990",
  birthdate: "01/15/1990",
  address: "123 Rizal St., Poblacion, Makati City",

  // Doctor
  doctorName: "Dr. Maria A. Santos",
  licenseNo: "0123456",
  ptrNo: "7654321",
  doctorAddress: "ABC Medical Clinic, 456 Ayala Ave., Makati City",

  // Dates
  date: "03/13/2026",
  requestDate: "03/13/2026",
  createdDate: "03/13/2026",
  createdDateTime: "March 13, 2026 9:00 AM",

  // Prescription
  medicine:
    "1.) Amoxicillin 500 mg #21<br/>Sig: Take 1 capsule 3x a day for 7 days<br/><br/>" +
    "2.) Paracetamol 500 mg #10<br/>Sig: Take 1 tablet as needed for fever or pain",
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
  referredBy: "Dr. Maria A. Santos",

  // Diagnostics
  diagnostics: "12-lead ECG, Chest X-ray",
  history: "Hypertension for 5 years. No previous cardiac workup.",
  requestFor: "R/O Ischemic Heart Disease",

  // Lab categories
  hematologyTests: "<strong>CBC, Platelet Count, Blood Typing</strong>",
  clinicalMicroscopyTests: "<strong>Urinalysis, Fecalysis</strong>",
  bloodChemistryTests: "<strong>FBS, HbA1c, Lipid Profile, BUN, Creatinine</strong>",
  microbiologyTests: "<strong>Sputum AFB</strong>",
  hormoneAssaysTests: "<strong>TSH, FT4</strong>",
  cardiacDiagnosticsTests: "<strong>12-lead ECG, 2D Echo</strong>",
};

/**
 * Renders a template with sample data for live preview purposes.
 * Uses simple regex substitution (no full Liquid engine) so it is safe to
 * call from client-side React components.
 */
export function renderPreviewTemplate(
  template: string,
  documentTypeName: string | null | undefined
): string {
  if (!template.trim()) return "";

  // Build context: global sample data + any schema variables not already covered
  const context: Record<string, string> = { ...DOCUMENT_TEMPLATE_SAMPLE_DATA };
  const schema = documentTypeName ? getTemplateVariableSchema(documentTypeName) : null;
  if (schema) {
    for (const v of schema.variables) {
      if (!(v.variable in context)) {
        context[v.variable] = `[${v.variable}]`;
      }
    }
  }

  // Replace {{ variable }}, {{- variable -}}, and legacy @{variable}
  return template
    .replace(/@\{(\w+)\}/g, (_, key: string) => context[key] ?? `[${key}]`)
    .replace(/\{\{-?\s*(\w+)\s*-?\}\}/g, (_, key: string) => context[key] ?? `[${key}]`);
}

// ---------------------------------------------------------------------------
// Template variable registry
// ---------------------------------------------------------------------------

export type TemplateVariableInfo = {
  /** The Liquid variable name, e.g. `name` */
  variable: string;
  /** Human-readable description */
  description: string;
};

export type TemplateVariableSchema = {
  /** Short description of this document type's template context */
  description: string;
  variables: TemplateVariableInfo[];
};

/**
 * Maps a document-type name (case-insensitive) to its available Liquid variables.
 *
 * Usage in a template: `{{ variableName }}`
 * Liquid also supports filters, e.g. `{{ name | upcase }}`
 */
export const DOCUMENT_TEMPLATE_VARIABLES: Record<string, TemplateVariableSchema> = {
  prescription: {
    description: "Variables available in Prescription templates",
    variables: [
      { variable: "name", description: "Patient's full name" },
      { variable: "age", description: "Patient's age" },
      { variable: "gender", description: "Patient's gender initial (M/F)" },
      { variable: "address", description: "Patient's home address" },
      { variable: "requestDate", description: "Date the prescription was created (MM/DD/YYYY)" },
      { variable: "createdDateTime", description: "Full date and time (MMMM DD, YYYY h:mm A)" },
      { variable: "medicine", description: "Formatted HTML list of all prescribed medicines with dosage and sig" },
      { variable: "doctorName", description: "Prescribing doctor's full name" },
      { variable: "licenseNo", description: "Doctor's PRC license number" },
      { variable: "ptrNo", description: "Doctor's PTR number" },
      { variable: "doctorAddress", description: "Doctor's clinic or office address" },
      { variable: "eSignatureUrl", description: "Doctor's e-signature (rendered as an <img> tag, or raw base64 URL when used inside src=\"\")" },
    ],
  },

  medical_certificate: {
    description: "Variables available in Medical Certificate templates",
    variables: [
      { variable: "patientName", description: "Patient's full name" },
      { variable: "age", description: "Patient's age" },
      { variable: "gender", description: "Patient's gender" },
      { variable: "address", description: "Patient's home address" },
      { variable: "createdDate", description: "Date the certificate was issued (MM/DD/YYYY)" },
      { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
      { variable: "doctorName", description: "Issuing doctor's full name" },
      { variable: "licenseNo", description: "Doctor's PRC license number" },
      { variable: "ptrNo", description: "Doctor's PTR number" },
      { variable: "eSignatureUrl", description: "Doctor's e-signature (base64 image URL)" },
      { variable: "selectedClassification", description: "Selected medical classification (blank when N/A)" },
      { variable: "selectedClassificationDescription", description: "Description of the selected classification" },
      { variable: "selectedReason", description: "Reason for the certificate" },
      { variable: "selectedFinding", description: "Physical examination findings" },
      { variable: "recommendations", description: "Doctor's recommendations" },
      { variable: "impression", description: "Clinical impression / diagnosis" },
    ],
  },

  referral: {
    description: "Variables available in Referral Slip templates",
    variables: [
      { variable: "patientName", description: "Patient's full name" },
      { variable: "age", description: "Patient's age" },
      { variable: "sex", description: "Patient's sex" },
      { variable: "dob", description: "Patient's date of birth" },
      { variable: "address", description: "Patient's home address" },
      { variable: "date", description: "Referral date (MM/DD/YYYY)" },
      { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
      { variable: "referredToSpecialty", description: "Specialty being referred to" },
      { variable: "chiefComplaint", description: "Chief complaint" },
      { variable: "briefHistory", description: "Brief medical history" },
      { variable: "impression", description: "Clinical impression / diagnosis" },
      { variable: "recommendation", description: "Doctor's recommendation" },
      { variable: "reasonForReferral", description: "Reason for referral" },
      { variable: "referredBy", description: "Referring doctor's name" },
    ],
  },

  imaging: {
    description: "Variables available in Imaging Study Request templates",
    variables: [
      { variable: "name", description: "Patient's full name" },
      { variable: "age", description: "Patient's age" },
      { variable: "gender", description: "Patient's gender (capitalized)" },
      { variable: "address", description: "Patient's home address" },
      { variable: "birthdate", description: "Patient's date of birth" },
      { variable: "requestDate", description: "Request date (MM/DD/YYYY)" },
      { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
      { variable: "diagnostics", description: "Requested imaging procedures" },
      { variable: "history", description: "Patient's relevant medical history" },
      { variable: "impression", description: "Clinical impression / diagnosis" },
      { variable: "requestFor", description: "Reason for the imaging request" },
      { variable: "doctorName", description: "Requesting doctor's full name" },
      { variable: "licenseNo", description: "Doctor's PRC license number" },
      { variable: "ptrNo", description: "Doctor's PTR number" },
      { variable: "doctorAddress", description: "Doctor's clinic or office address" },
      { variable: "eSignatureUrl", description: "Doctor's e-signature (base64 image URL)" },
    ],
  },

  laboratory: {
    description: "Variables available in Laboratory Request templates",
    variables: [
      { variable: "name", description: "Patient's full name" },
      { variable: "age", description: "Patient's age" },
      { variable: "gender", description: "Patient's gender" },
      { variable: "address", description: "Patient's home address" },
      { variable: "birthdate", description: "Patient's date of birth" },
      { variable: "requestDate", description: "Request date (MM/DD/YYYY)" },
      { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
      { variable: "impression", description: "Clinical impression / diagnosis" },
      { variable: "doctorName", description: "Requesting doctor's full name" },
      { variable: "licenseNo", description: "Doctor's PRC license number" },
      { variable: "ptrNo", description: "Doctor's PTR number" },
      { variable: "doctorAddress", description: "Doctor's clinic or office address" },
      { variable: "eSignatureUrl", description: "Doctor's e-signature (base64 image URL)" },
      { variable: "hematologyTests", description: "Hematology tests (bold, comma-separated)" },
      { variable: "clinicalMicroscopyTests", description: "Clinical microscopy tests (bold, comma-separated)" },
      { variable: "bloodChemistryTests", description: "Blood chemistry tests (bold, comma-separated)" },
      { variable: "microbiologyTests", description: "Microbiology tests (bold, comma-separated)" },
      { variable: "hormoneAssaysTests", description: "Hormone assays tests (bold, comma-separated)" },
      { variable: "cardiacDiagnosticsTests", description: "Cardiac diagnostics tests (bold, comma-separated)" },
    ],
  },

  heart_station: {
    description: "Variables available in Heart Station Request templates",
    variables: [
      { variable: "name", description: "Patient's full name" },
      { variable: "age", description: "Patient's age" },
      { variable: "gender", description: "Patient's gender" },
      { variable: "address", description: "Patient's home address" },
      { variable: "birthdate", description: "Patient's date of birth" },
      { variable: "requestDate", description: "Request date (MM/DD/YYYY)" },
      { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
      { variable: "diagnostics", description: "Requested heart station procedures" },
      { variable: "history", description: "Patient's relevant medical history" },
      { variable: "impression", description: "Clinical impression / diagnosis" },
      { variable: "requestFor", description: "Reason for the request" },
      { variable: "doctorName", description: "Requesting doctor's full name" },
      { variable: "licenseNo", description: "Doctor's PRC license number" },
      { variable: "ptrNo", description: "Doctor's PTR number" },
      { variable: "eSignatureUrl", description: "Doctor's e-signature (base64 image URL)" },
    ],
  },
};

/**
 * Resolves the template variable schema for a given document type name.
 *
 * The lookup is case-insensitive and matches by substring, so "Medical Certificate"
 * resolves to the `medical_certificate` schema, "Imaging Study" resolves to `imaging`, etc.
 *
 * Returns `null` if no matching schema is found.
 */
export function getTemplateVariableSchema(
  documentTypeName: string
): TemplateVariableSchema | null {
  const normalized = documentTypeName.toLowerCase().replace(/[\s-]+/g, "_");

  // Direct key match first
  if (normalized in DOCUMENT_TEMPLATE_VARIABLES) {
    return DOCUMENT_TEMPLATE_VARIABLES[normalized];
  }

  // Substring / pattern matching for flexible DB names
  const matchers: Array<[RegExp, string]> = [
    [/prescription/, "prescription"],
    [/medical.cert|medcert/, "medical_certificate"],
    [/referral/, "referral"],
    [/imaging/, "imaging"],
    [/laborator/, "laboratory"],
    [/heart.station|heartstation/, "heart_station"],
  ];

  for (const [pattern, key] of matchers) {
    if (pattern.test(normalized)) {
      return DOCUMENT_TEMPLATE_VARIABLES[key] ?? null;
    }
  }

  return null;
}
