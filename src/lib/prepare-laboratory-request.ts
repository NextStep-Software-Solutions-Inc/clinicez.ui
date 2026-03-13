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

export const prepareLaboratoryRequest = (payload: PrepareLaboratoryRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;
  const { impression, diagnosticsByCategory, createdAt } = request;

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
    doctorAddress,
    createdDateTime,
    eSignatureUrl: eSignatureBase64 || "",
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

  return renderLiquidTemplate(template, variables);
};
