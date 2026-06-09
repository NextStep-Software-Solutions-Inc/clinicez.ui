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

export const prepareImagingStudy = (payload: PrepareImagingStudyPayload): string => {
  const { template, patient, doctor, study } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;
  const { diagnostics, history, impression, requestFor, createdAt } = study;

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
    doctorAddress,
    createdDateTime,
    eSignatureUrl: eSignatureBase64 || "",
  };

  return renderLiquidTemplate(template, variables);
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
