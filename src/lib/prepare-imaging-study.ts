import dayjs from "@lib/day-utils";
import { capitalize } from "./utils";
import { renderLiquidTemplate } from "./liquid-template";

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
    diagnostics: string;
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

  const variables = {
    name,
    age,
    gender: capitalize(gender),
    address,
    birthdate,
    requestDate,
    diagnostics,
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
