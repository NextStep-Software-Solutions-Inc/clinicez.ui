import { getTemplateVariableSchema } from "./document-template-schema";

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
 *
 * Uses simple regex substitution (no full Liquid engine) so it is safe to
 * call from client-side React components without bundling the server-side
 * Liquid dependency.
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
