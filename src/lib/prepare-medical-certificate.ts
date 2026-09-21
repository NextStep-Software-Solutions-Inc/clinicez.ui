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

const DEFAULT_MEDICAL_CERTIFICATE_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; background: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">{{ doctorName }}</h2>
    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">License No: {{ licenseNo }} &nbsp;|&nbsp; PTR No: {{ ptrNo }}</p>
  </div>

  <h3 style="text-align: center; margin: 10px 0 24px; font-size: 20px; text-transform: uppercase; letter-spacing: 1.5px; color: #0369a1;">Medical Certificate</h3>

  <div style="text-align: right; margin-bottom: 20px; font-size: 13px;">
    <strong>Date:</strong> {{ createdDate }}
  </div>

  <div style="font-size: 14px; line-height: 1.8; margin-bottom: 30px; text-align: justify;">
    <p style="margin-bottom: 16px;"><strong>TO WHOM IT MAY CONCERN:</strong></p>

    <p style="margin-bottom: 16px;">
      This is to certify that <strong>{{ name }}</strong>, {{ age }} years old, {{ gender }}, residing at {{ address }}, was examined and treated at this clinic on <strong>{{ createdDate }}</strong>.
    </p>

    {% if finding %}
    <p style="margin-bottom: 16px;">
      <strong>Clinical Findings:</strong> {{ finding }}
    </p>
    {% endif %}

    {% if impression %}
    <p style="margin-bottom: 16px;">
      <strong>Diagnosis / Impression:</strong> {{ impression }}
    </p>
    {% endif %}

    {% if recommendations %}
    <p style="margin-bottom: 16px;">
      <strong>Recommendations & Remarks:</strong> {{ recommendations }}
    </p>
    {% endif %}

    <p style="margin-top: 24px;">
      This medical certificate is issued upon the request of the patient for <strong>{{ reason }}</strong>.
    </p>
  </div>

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

  const rawTemplate = (template || "").trim();
  const effectiveTemplate = rawTemplate || DEFAULT_MEDICAL_CERTIFICATE_TEMPLATE;

  const createdDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  // Hide classification if it's "N/A"
  const shouldShowClassification = classification && classification.toUpperCase() !== "N/A";

  const variables = {
    createdDate,
    createdDateTime,
    name: patientName,
    patientName,
    age,
    gender,
    address,
    doctorName,
    licenseNo,
    ptrNo,
    eSignatureUrl: eSignatureBase64 || "",
    classification: shouldShowClassification ? classification : "",
    selectedClassification: shouldShowClassification ? classification : "",
    classificationDescription: shouldShowClassification ? classificationDescription : "",
    selectedClassificationDescription: shouldShowClassification ? classificationDescription : "",
    reason: reason || "whatever legal purpose it may serve",
    selectedReason: reason || "whatever legal purpose it may serve",
    finding: finding || "N/A",
    selectedFinding: finding || "N/A",
    recommendations: recommendations || "N/A",
    impression: impression || "N/A",
  };

  return renderLiquidTemplate(effectiveTemplate, variables);
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
