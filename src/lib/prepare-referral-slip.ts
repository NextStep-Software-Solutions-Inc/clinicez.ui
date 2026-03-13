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

  return renderLiquidTemplate(template, variables);
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
