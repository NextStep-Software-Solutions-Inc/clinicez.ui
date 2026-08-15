import dayjs from "@lib/day-utils";
import { renderLiquidTemplate } from "./liquid-template";

type PrepareHeartStationRequestPayload = {
  template: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    address: string;
    birthdate?: string;
  };
  doctor: {
    name: string;
    licenseNo: string;
    ptrNo: string;
    address?: string;
    eSignatureBase64?: string;
  };
  request: {
    diagnostics: string[];
    history?: string;
    impression?: string;
    requestFor?: string;
    createdAt: Date | string;
  };
};

const DEFAULT_HEART_STATION_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; background: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">{{ doctorName }}</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">{{ doctorAddress }}</p>
    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">License No: {{ licenseNo }} &nbsp;|&nbsp; PTR No: {{ ptrNo }}</p>
  </div>

  <h3 style="text-align: center; margin: 10px 0 20px; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; color: #0369a1;">Heart Station Requisition Form</h3>

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
    <h4 style="margin: 0 0 10px; font-size: 14px; color: #0369a1; text-transform: uppercase;">Requested Procedure(s):</h4>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
      {% for item in diagnostics %}
        <li><strong>{{ item }}</strong></li>
      {% else %}
        <li><em>{{ requestFor }}</em></li>
      {% endfor %}
    </ul>
  </div>

  {% if impression %}
  <div style="margin-bottom: 24px; font-size: 13px;">
    <strong>Clinical Impression / Remarks:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border-left: 3px solid #0284c7;">{{ impression }}</p>
  </div>
  {% endif %}

  {% if history %}
  <div style="margin-bottom: 24px; font-size: 13px;">
    <strong>Relevant Medical History:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border-left: 3px solid #64748b;">{{ history }}</p>
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

export const prepareHeartStationRequest = (payload: PrepareHeartStationRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;
  const { diagnostics, history, impression, requestFor, createdAt } = request;

  const rawTemplate = (template || "").trim();
  const hasPlaceholders = Boolean(
    rawTemplate &&
    (rawTemplate.includes("{{") || rawTemplate.includes("@{") || rawTemplate.toLowerCase().includes("diagnostics") || rawTemplate.toLowerCase().includes("name"))
  );

  const effectiveTemplate = hasPlaceholders
    ? rawTemplate
    : DEFAULT_HEART_STATION_TEMPLATE;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  const variables = {
    name,
    age,
    gender,
    address,
    birthdate: birthdate ?? "",
    requestDate,
    diagnostics,
    history: history ?? "",
    impression: impression ?? "",
    requestFor: requestFor ?? "",
    doctorName,
    licenseNo,
    ptrNo,
    doctorAddress: doctorAddress ?? "N/A",
    eSignatureUrl: eSignatureBase64 ?? "",
    createdDateTime,
  };

  return renderLiquidTemplate(effectiveTemplate, variables);
};

import type { TemplateVariableSchema } from "./document-template-schema";

export const TEMPLATE_VARIABLE_SCHEMA: TemplateVariableSchema & { key: string } = {
  key: "heart_station",
  description: "Variables available in Heart Station Request templates",
  variables: [
    { variable: "name", description: "Patient's full name" },
    { variable: "age", description: "Patient's age" },
    { variable: "gender", description: "Patient's gender" },
    { variable: "address", description: "Patient's home address" },
    { variable: "birthdate", description: "Patient's date of birth" },
    { variable: "requestDate", description: "Request date (MM/DD/YYYY)" },
    { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
    { variable: "diagnostics", type: "array-of-strings" as const, description: "Requested heart station procedures" },
    { variable: "history", description: "Patient's relevant medical history" },
    { variable: "impression", description: "Clinical impression / diagnosis" },
    { variable: "requestFor", description: "Reason for the request" },
    { variable: "doctorName", description: "Requesting doctor's full name" },
    { variable: "licenseNo", description: "Doctor's PRC license number" },
    { variable: "ptrNo", description: "Doctor's PTR number" },
    { variable: "eSignatureUrl", description: "Doctor's e-signature (base64 image URL)" },
  ],
};
