// ---------------------------------------------------------------------------
// Template variable types and registry
// ---------------------------------------------------------------------------

export type TemplateVariableType =
  | "string"
  | "html"
  | "number"
  /** An array of plain strings, e.g. lab test names */
  | "array-of-strings"
  /** An array of objects — each item has typed `properties` */
  | "array-of-objects";

/** A single property on an array-of-objects item */
export type TemplatePropertyInfo = {
  /** Property name accessed as `<loopVar>.<variable>` inside a for loop */
  variable: string;
  description: string;
};

/** Scalar (string / html / number) variable */
type ScalarVariableInfo = {
  variable: string;
  description: string;
  type?: "string" | "html" | "number";
  loopVar?: never;
  properties?: never;
};

/** Array-of-strings variable (e.g. lab test categories) */
type ArrayOfStringsVariableInfo = {
  variable: string;
  description: string;
  type: "array-of-strings";
  loopVar?: never;
  properties?: never;
};

/** Array-of-objects variable — requires explicit loopVar and properties */
export type ArrayOfObjectsVariableInfo = {
  variable: string;
  description: string;
  type: "array-of-objects";
  /** The loop alias, e.g. `"med"` for `{% for med in medicines %}` */
  loopVar: string;
  /** Typed properties of each item in the array */
  properties: TemplatePropertyInfo[];
};

export type TemplateVariableInfo =
  | ScalarVariableInfo
  | ArrayOfStringsVariableInfo
  | ArrayOfObjectsVariableInfo;

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
      {
        variable: "medicines",
        type: "array-of-objects",
        loopVar: "med",
        description: "Array of prescribed medicines — iterate with {% for med in medicines %}",
        properties: [
          { variable: "index", description: "Item number (1, 2, 3…)" },
          { variable: "name", description: "Medicine name" },
          { variable: "dosage", description: "Dosage amount (e.g. 500 mg)" },
          { variable: "unit", description: "Unit (e.g. capsules, tablets)" },
          { variable: "qty", description: "Quantity (number)" },
          { variable: "sig", description: "Patient directions / sig instructions" },
          { variable: "label", description: "Formatted: name + dosage + #qty" },
        ],
      },
      { variable: "medicine", type: "html", description: "Legacy: pre-formatted HTML list of all medicines (for older templates)" },
      { variable: "doctorName", description: "Prescribing doctor's full name" },
      { variable: "licenseNo", description: "Doctor's PRC license number" },
      { variable: "ptrNo", description: "Doctor's PTR number" },
      { variable: "doctorAddress", description: "Doctor's clinic or office address" },
      { variable: "eSignatureUrl", type: "html", description: "Doctor's e-signature (<img> tag, or raw base64 URL when used inside src=\"\")" },
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
      { variable: "eSignatureUrl", type: "html", description: "Doctor's e-signature (base64 image URL)" },
      { variable: "hematology", type: "array-of-strings", description: "Hematology test names" },
      { variable: "clinicalMicroscopy", type: "array-of-strings", description: "Clinical microscopy test names" },
      { variable: "bloodChemistry", type: "array-of-strings", description: "Blood chemistry test names" },
      { variable: "microbiology", type: "array-of-strings", description: "Microbiology test names" },
      { variable: "hormoneAssays", type: "array-of-strings", description: "Hormone assays test names" },
      { variable: "cardiacDiagnostics", type: "array-of-strings", description: "Cardiac diagnostics test names" },
      { variable: "hematologyTests", type: "html", description: "Legacy: hematology tests as bold HTML string" },
      { variable: "clinicalMicroscopyTests", type: "html", description: "Legacy: clinical microscopy tests as bold HTML string" },
      { variable: "bloodChemistryTests", type: "html", description: "Legacy: blood chemistry tests as bold HTML string" },
      { variable: "microbiologyTests", type: "html", description: "Legacy: microbiology tests as bold HTML string" },
      { variable: "hormoneAssaysTests", type: "html", description: "Legacy: hormone assays tests as bold HTML string" },
      { variable: "cardiacDiagnosticsTests", type: "html", description: "Legacy: cardiac diagnostics tests as bold HTML string" },
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
