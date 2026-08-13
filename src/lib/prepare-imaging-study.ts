import dayjs from "@lib/day-utils";
import { capitalize } from "./utils";
import { renderLiquidTemplate } from "./liquid-template";

export type ImagingDiagnosticItem = {
  name: string;
  bodyPart?: string;
  notes?: string;
};

type PrepareImagingStudyPayload = {
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
  study: {
    diagnostics: (string | ImagingDiagnosticItem)[];
    history: string;
    impression: string;
    requestFor: string;
    createdAt: Date | string;
  };
};

const DEFAULT_IMAGING_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; background: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">{{ doctorName }}</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">{{ doctorAddress }}</p>
    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">License No: {{ licenseNo }} &nbsp;|&nbsp; PTR No: {{ ptrNo }}</p>
  </div>

  <h3 style="text-align: center; margin: 10px 0 20px; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; color: #0369a1;">Imaging / Radiology Request Form</h3>

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
    <h4 style="margin: 0 0 10px; font-size: 14px; color: #0369a1; text-transform: uppercase;">Requested Imaging Procedure(s):</h4>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
      {% for item in diagnosticItems %}
        <li><strong>{{ item.name }}</strong> {% if item.bodyPart %}(<em>{{ item.bodyPart }}</em>){% endif %}{% if item.notes %} - Notes: {{ item.notes }}{% endif %}</li>
      {% else %}
        {% for name in diagnostics %}
          <li><strong>{{ name }}</strong></li>
        {% endfor %}
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

export const prepareImagingStudy = (payload: PrepareImagingStudyPayload): string => {
  const { template, patient, doctor, study } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;
  const { diagnostics, history, impression, requestFor, createdAt } = study;

  const rawTemplate = (template || "").trim();
  const hasPlaceholders = Boolean(
    rawTemplate &&
    (rawTemplate.includes("{{") || rawTemplate.includes("@{") || rawTemplate.toLowerCase().includes("diagnostics") || rawTemplate.toLowerCase().includes("name"))
  );

  const effectiveTemplate = hasPlaceholders
    ? rawTemplate
    : DEFAULT_IMAGING_TEMPLATE;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  // Normalise diagnostics: support both plain strings and objects with body part / notes
  const diagnosticItems: ImagingDiagnosticItem[] = diagnostics.map(d =>
    typeof d === "string" ? { name: d } : d
  );

  // Flat list of procedure name strings for backward-compatible {{ diagnostics }} loops
  const diagnosticNames = diagnosticItems.map(d => d.name);

  const variables = {
    name,
    age,
    gender: capitalize(gender),
    address,
    birthdate,
    requestDate,
    diagnostics: diagnosticNames,
    diagnosticItems,
    history: history || "No history provided.",
    impression: impression || "No impression provided.",
    requestFor: requestFor || "No request reason provided.",
    doctorName,
    licenseNo,
    ptrNo,
    doctorAddress: doctorAddress || "N/A",
    createdDateTime,
    eSignatureUrl: eSignatureBase64 || "",
  };

  return renderLiquidTemplate(effectiveTemplate, variables);
};

import type { TemplateVariableSchema } from "./document-template-schema";

export const TEMPLATE_VARIABLE_SCHEMA: TemplateVariableSchema & { key: string } = {
  key: "imaging",
  description: "Variables available in Imaging Study Request templates",
  variables: [
    { variable: "name", description: "Patient's full name" },
    { variable: "age", description: "Patient's age" },
    { variable: "gender", description: "Patient's gender (capitalized)" },
    { variable: "address", description: "Patient's home address" },
    { variable: "birthdate", description: "Patient's date of birth" },
    { variable: "requestDate", description: "Request date (MM/DD/YYYY)" },
    { variable: "createdDateTime", description: "Full date and time (MM/DD/YYYY h:mm A)" },
    { variable: "diagnostics", type: "array-of-strings" as const, description: "Requested imaging procedure names (plain strings)" },
    {
      variable: "diagnosticItems",
      type: "array-of-objects" as const,
      loopVar: "item",
      description: "Requested procedures with body part and technologist notes — iterate with {% for item in diagnosticItems %}",
      properties: [
        { variable: "name", description: "Imaging procedure name" },
        { variable: "bodyPart", description: "Body part to image (e.g. Chest, Left Knee)" },
        { variable: "notes", description: "Technologist instructions / special notes" },
      ],
    },
    { variable: "history", description: "Patient's relevant medical history" },
    { variable: "impression", description: "Clinical impression / diagnosis" },
    { variable: "requestFor", description: "Reason for the imaging request" },
    { variable: "doctorName", description: "Requesting doctor's full name" },
    { variable: "licenseNo", description: "Doctor's PRC license number" },
    { variable: "ptrNo", description: "Doctor's PTR number" },
    { variable: "doctorAddress", description: "Doctor's clinic or office address" },
    { variable: "eSignatureUrl", description: "Doctor's e-signature (base64 image URL)" },
  ],
};
