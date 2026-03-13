import dayjs from "@lib/day-utils";
import { renderLiquidTemplate } from "./liquid-template";

type PrepareMedicalCertificatePayload = {
  template: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    address: string;
  };
  doctor: {
    name: string;
    licenseNo: string;
    ptrNo: string;
    eSignatureBase64?: string;
  };
  certificate: {
    classification: string;
    classificationDescription: string;
    reason: string;
    finding: string;
    recommendations: string;
    impression: string;
    createdAt: Date | string;
  };
};

export const prepareMedicalCertificate = (payload: PrepareMedicalCertificatePayload): string => {
  const { template, patient, doctor, certificate } = payload;
  const { name: patientName, age, gender, address } = patient;
  const { name: doctorName, licenseNo, ptrNo, eSignatureBase64 } = doctor;
  const {
    classification,
    classificationDescription,
    reason,
    finding,
    recommendations,
    impression,
    createdAt,
  } = certificate;

  const createdDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  // Hide classification if it's "N/A"
  const shouldShowClassification = classification && classification.toUpperCase() !== "N/A";

  const variables = {
    createdDate,
    createdDateTime,
    patientName,
    age,
    gender,
    address,
    doctorName,
    licenseNo,
    ptrNo,
    eSignatureUrl: eSignatureBase64 || "",
    selectedClassification: shouldShowClassification ? classification : "",
    selectedClassificationDescription: shouldShowClassification ? classificationDescription : "",
    selectedReason: reason,
    selectedFinding: finding,
    recommendations: recommendations || "No recommendations provided.",
    impression: impression || "No impressions provided.",
  };

  return renderLiquidTemplate(template, variables);
};

import type { TemplateVariableSchema } from "./document-template-schema";

export const TEMPLATE_VARIABLE_SCHEMA: TemplateVariableSchema & { key: string } = {
  key: "medical_certificate",
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
};
