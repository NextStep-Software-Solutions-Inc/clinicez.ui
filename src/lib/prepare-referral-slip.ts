import dayjs from "@lib/day-utils";
import { renderLiquidTemplate } from "./liquid-template";

type PrepareReferralSlipPayload = {
  template: string;
  patient: {
    name: string;
    age: string;
    sex: string;
    dob: string;
    address: string;
  };
  referral: {
    referredToSpecialty: string;
    chiefComplaint: string;
    briefHistory: string;
    impression: string;
    recommendation: string;
    reasonForReferral: string;
    referredBy: string;
    createdAt: Date | string;
  };
};

const DEFAULT_REFERRAL_SLIP_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; background: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">MEDICAL REFERRAL SLIP</h2>
  </div>

  <div style="text-align: right; margin-bottom: 20px; font-size: 13px;">
    <strong>Date:</strong> {{ date }}
  </div>

  <div style="margin-bottom: 20px; padding: 12px; background: #f0f9ff; border-left: 4px solid #0284c7; font-size: 14px;">
    <strong>Referred To / Specialty:</strong> {{ referredToSpecialty }}
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <tr>
      <td style="padding: 4px 0; width: 60%;"><strong>Patient Name:</strong> {{ patientName }}</td>
      <td style="padding: 4px 0; text-align: right;"><strong>DOB:</strong> {{ dob }}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Address:</strong> {{ address }}</td>
      <td style="padding: 4px 0; text-align: right;"><strong>Age / Sex:</strong> {{ age }} yrs / {{ sex }}</td>
    </tr>
  </table>

  <div style="margin-bottom: 20px; font-size: 13px;">
    <strong>Chief Complaint:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px;">{{ chiefComplaint }}</p>
  </div>

  <div style="margin-bottom: 20px; font-size: 13px;">
    <strong>Brief Clinical History:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px;">{{ briefHistory }}</p>
  </div>

  <div style="margin-bottom: 20px; font-size: 13px;">
    <strong>Impression / Diagnosis:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px;">{{ impression }}</p>
  </div>

  <div style="margin-bottom: 20px; font-size: 13px;">
    <strong>Reason for Referral & Recommendations:</strong>
    <p style="margin: 4px 0 0; padding: 10px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px;">{{ reasonForReferral }} - {{ recommendation }}</p>
  </div>

  <div style="display: flex; justify-content: flex-end; margin-top: 40px; page-break-inside: avoid;">
    <div style="text-align: center; min-width: 220px;">
      <div style="border-top: 1px solid #334155; padding-top: 6px; font-size: 14px; font-weight: 700; color: #0f172a;">
        {{ referredBy }}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        Referring Physician / Provider
      </div>
    </div>
  </div>
</div>
`;

export const prepareReferralSlip = (payload: PrepareReferralSlipPayload): string => {
  const { template, patient, referral } = payload;
  const { name: patientName, age, sex, dob, address } = patient;
  const {
    referredToSpecialty,
    chiefComplaint,
    briefHistory,
    impression,
    recommendation,
    reasonForReferral,
    referredBy,
    createdAt,
  } = referral;

  const rawTemplate = (template || "").trim();
  const hasPlaceholders = Boolean(
    rawTemplate &&
    (rawTemplate.includes("{{") || rawTemplate.includes("@{") || rawTemplate.toLowerCase().includes("patientname") || rawTemplate.toLowerCase().includes("referredtospecialty"))
  );

  const effectiveTemplate = hasPlaceholders
    ? rawTemplate
    : DEFAULT_REFERRAL_SLIP_TEMPLATE;

  const createdDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  const variables = {
    date: createdDate,
    createdDateTime,
    patientName,
    age,
    sex,
    dob,
    address,
    referredToSpecialty,
    chiefComplaint: chiefComplaint || "No chief complaint provided.",
    briefHistory: briefHistory || "No brief history provided.",
    impression: impression || "No impression provided.",
    recommendation: recommendation || "No recommendation provided.",
    reasonForReferral: reasonForReferral || "No reason provided.",
    referredBy,
  };

  return renderLiquidTemplate(effectiveTemplate, variables);
};

import type { TemplateVariableSchema } from "./document-template-schema";

export const TEMPLATE_VARIABLE_SCHEMA: TemplateVariableSchema & { key: string } = {
  key: "referral",
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
};
