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
    diagnostics: string;
    history?: string;
    impression?: string;
    requestFor?: string;
    createdAt: Date | string;
  };
};

export const prepareHeartStationRequest = (payload: PrepareHeartStationRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, eSignatureBase64 } = doctor;
  const { diagnostics, history, impression, requestFor, createdAt } = request;

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
    eSignatureUrl: eSignatureBase64 ?? "",
    createdDateTime,
  };

  return renderLiquidTemplate(template, variables);
};
