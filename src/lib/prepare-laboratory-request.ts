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

  // Helper function to format category tests as comma-separated bold text
  const formatCategoryTests = (category: string): string => {
    const tests = diagnosticsByCategory[category] || [];
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
    hematologyTests: formatCategoryTests("HEMATOLOGY"),
    clinicalMicroscopyTests: formatCategoryTests("CLINICAL MICROSCOPY") || formatCategoryTests("MICROSCOPY"),
    bloodChemistryTests: formatCategoryTests("BLOOD CHEMISTRY") || formatCategoryTests("CHEMISTRY"),
    microbiologyTests: formatCategoryTests("MICROBIOLOGY"),
    hormoneAssaysTests: formatCategoryTests("HORMONE ASSAYS") || formatCategoryTests("HORMONES"),
    cardiacDiagnosticsTests: formatCategoryTests("CARDIAC DIAGNOSTICS") || formatCategoryTests("CARDIAC") || formatCategoryTests("ECG"),
  };

  return renderLiquidTemplate(template, variables);
};
