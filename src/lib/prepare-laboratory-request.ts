import dayjs from "@lib/day-utils";
import { renderLiquidTemplate } from "./liquid-template";

type PrepareLaboratoryRequestPayload = {
  template: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    address: string;
    birthdate: string;
  };
  doctor: {
    name: string;
    licenseNo: string;
    ptrNo: string;
    address: string;
    eSignatureBase64?: string;
  };
  request: {
    impression: string;
    diagnosticsByCategory: Record<string, string[]>;
    createdAt: Date | string;
  };
};

const DEFAULT_LABORATORY_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; background: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">{{ doctorName }}</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">{{ doctorAddress }}</p>
    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">License No: {{ licenseNo }} &nbsp;|&nbsp; PTR No: {{ ptrNo }}</p>
  </div>

  <h3 style="text-align: center; margin: 10px 0 20px; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; color: #0369a1;">Laboratory Request Form</h3>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <tr>
      <td style="padding: 4px 0; width: 60%;"><strong>Patient Name:</strong> {{ name }}</td>
      <td style="padding: 4px 0; text-align: right;"><strong>Date:</strong> {{ requestDate }}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Address:</strong> {{ address }}</td>
      <td style="padding: 4px 0; text-align: right;"><strong>Age / Sex:</strong> {{ age }} yrs / {{ gender }}</td>
    </tr>
  </table>

  <div style="margin-bottom: 24px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
    <h4 style="margin: 0 0 10px; font-size: 14px; color: #0369a1; text-transform: uppercase;">Requested Laboratory Tests:</h4>
    {% for group in diagnostics %}
      <div style="margin-bottom: 10px;">
        <strong style="color: #0f172a; font-size: 13px;">{{ group.category }}:</strong>
        <div style="margin-top: 4px; padding-left: 12px; font-size: 13px;">
          {% for test in group.tests %}
            <span style="display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; padding: 3px 8px; margin: 2px 4px 2px 0; border-radius: 4px; font-size: 12px;">✓ {{ test }}</span>
          {% endfor %}
        </div>
      </div>
    {% endfor %}
  </div>

  {% if impression %}
  <div style="margin-bottom: 24px; font-size: 13px;">
    <strong>Clinical Impression / Remarks:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border-left: 3px solid #0284c7;">{{ impression }}</p>
  </div>
  {% endif %}

  <div style="display: flex; justify-content: flex-end; margin-top: 50px; page-break-inside: avoid;">
    <div style="text-align: center; min-width: 220px;">
      <div style="min-height: 70px; display: flex; align-items: center; justify-content: center;">
        {% if eSignatureUrl != "" %}<img src="{{ eSignatureUrl }}" alt="Doctor e-signature" style="max-height: 96px;" />{% endif %}
      </div>
      <div style="border-top: 1px solid #334155; padding-top: 6px; font-size: 14px; font-weight: 700; color: #0f172a;">
        {{ doctorName }}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        Lic. No: {{ licenseNo }}
      </div>
    </div>
  </div>
</div>
`;

export const prepareLaboratoryRequest = (payload: PrepareLaboratoryRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;
  const { impression, diagnosticsByCategory, createdAt } = request;

  const rawTemplate = (template || "").trim();
  const hasPlaceholders = Boolean(
    rawTemplate &&
    (rawTemplate.includes("{{") || rawTemplate.includes("@{") || rawTemplate.toLowerCase().includes("diagnostics") || rawTemplate.toLowerCase().includes("name"))
  );

  const effectiveTemplate = hasPlaceholders
    ? rawTemplate
    : DEFAULT_LABORATORY_TEMPLATE;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  // Helper to get tests for a category as a string array
  const getCategoryTests = (category: string): string[] =>
    diagnosticsByCategory[category] ?? [];

  // Helper to get tests as legacy bold HTML (backward compat for {{ hematologyTests }} etc.)
  const formatCategoryTests = (category: string): string => {
    const tests = getCategoryTests(category);
    return tests.length > 0 ? `<strong>${tests.join(", ")}</strong>` : "";
  };

  const variables = {
    name,
    age,
    gender,
    address,
    birthdate,
    requestDate,
    impression: impression || "No impression provided.",
    doctorName,
    licenseNo,
    ptrNo,
    doctorAddress: doctorAddress || "N/A",
    createdDateTime,
    eSignatureUrl: eSignatureBase64 || "",
    // Diagnostics grouped by category (use with {% for group in diagnostics %} in templates)
    diagnostics: Object.entries(diagnosticsByCategory).map(([category, tests]) => ({ category, tests })),
    // Array variables — use with {% for test in hematology %} in templates
    hematology: getCategoryTests("HEMATOLOGY"),
    clinicalMicroscopy: (() => {
      const tests = getCategoryTests("CLINICAL MICROSCOPY");
      return tests.length ? tests : getCategoryTests("MICROSCOPY");
    })(),
    bloodChemistry: (() => {
      const tests = getCategoryTests("BLOOD CHEMISTRY");
      return tests.length ? tests : getCategoryTests("CHEMISTRY");
    })(),
    microbiology: getCategoryTests("MICROBIOLOGY"),
    hormoneAssays: (() => {
      const tests = getCategoryTests("HORMONE ASSAYS");
      return tests.length ? tests : getCategoryTests("HORMONES");
    })(),
    cardiacDiagnostics: (() => {
      const cardiac = getCategoryTests("CARDIAC DIAGNOSTICS");
      if (cardiac.length) return cardiac;
      const cardiacShort = getCategoryTests("CARDIAC");
      return cardiacShort.length ? cardiacShort : getCategoryTests("ECG");
    })(),
    // Legacy HTML-string variables — kept for backward-compatible templates
    hematologyTests: formatCategoryTests("HEMATOLOGY"),
    clinicalMicroscopyTests:
      formatCategoryTests("CLINICAL MICROSCOPY") || formatCategoryTests("MICROSCOPY"),
    bloodChemistryTests:
      formatCategoryTests("BLOOD CHEMISTRY") || formatCategoryTests("CHEMISTRY"),
    microbiologyTests: formatCategoryTests("MICROBIOLOGY"),
    hormoneAssaysTests:
      formatCategoryTests("HORMONE ASSAYS") || formatCategoryTests("HORMONES"),
    cardiacDiagnosticsTests:
      formatCategoryTests("CARDIAC DIAGNOSTICS") ||
      formatCategoryTests("CARDIAC") ||
      formatCategoryTests("ECG"),
  };

  return renderLiquidTemplate(effectiveTemplate, variables);
};

import type { TemplateVariableSchema } from "./document-template-schema";

export const TEMPLATE_VARIABLE_SCHEMA: TemplateVariableSchema & { key: string } = {
  key: "laboratory",
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
    { variable: "eSignatureUrl", type: "html" as const, description: "Doctor's e-signature (base64 image URL)" },
    { variable: "diagnostics", type: "array-of-objects" as const, description: "Requested tests grouped by category", loopVar: "group", properties: [
      { variable: "category", description: "Category name (e.g., HEMATOLOGY)" },
      { variable: "tests", description: "Array of test names in this category" },
    ] },
    { variable: "hematology", type: "array-of-strings" as const, description: "Hematology test names" },
    { variable: "clinicalMicroscopy", type: "array-of-strings" as const, description: "Clinical microscopy test names" },
    { variable: "bloodChemistry", type: "array-of-strings" as const, description: "Blood chemistry test names" },
    { variable: "microbiology", type: "array-of-strings" as const, description: "Microbiology test names" },
    { variable: "hormoneAssays", type: "array-of-strings" as const, description: "Hormone assays test names" },
    { variable: "cardiacDiagnostics", type: "array-of-strings" as const, description: "Cardiac diagnostics test names" },
    { variable: "hematologyTests", type: "html" as const, description: "Legacy: hematology tests as bold HTML string" },
    { variable: "clinicalMicroscopyTests", type: "html" as const, description: "Legacy: clinical microscopy tests as bold HTML string" },
    { variable: "bloodChemistryTests", type: "html" as const, description: "Legacy: blood chemistry tests as bold HTML string" },
    { variable: "microbiologyTests", type: "html" as const, description: "Legacy: microbiology tests as bold HTML string" },
    { variable: "hormoneAssaysTests", type: "html" as const, description: "Legacy: hormone assays tests as bold HTML string" },
    { variable: "cardiacDiagnosticsTests", type: "html" as const, description: "Legacy: cardiac diagnostics tests as bold HTML string" },
  ],
};
