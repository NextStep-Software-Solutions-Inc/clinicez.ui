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
