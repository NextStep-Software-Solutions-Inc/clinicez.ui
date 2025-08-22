import dayjs from "@lib/day-utils";
import { capitalize } from "./utils";

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
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress } = doctor;
  const { diagnostics, history, impression, requestFor, createdAt } = study;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  const replacements = {
    "@{name}": name,
    "@{age}": age,
    "@{gender}": capitalize(gender),
    "@{address}": address,
    "@{birthdate}": birthdate,
    "@{requestDate}": requestDate,
    "@{diagnostics}": diagnostics,
    "@{history}": history || "No history provided.",
    "@{impression}": impression || "No impression provided.",
    "@{requestFor}": requestFor || "No request reason provided.",
    "@{doctorName}": doctorName,
    "@{licenseNo}": licenseNo,
    "@{ptrNo}": ptrNo,
    "@{doctorAddress}": doctorAddress,
    "@{createdDateTime}": createdDateTime,
  };

  let outputTemplate = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    outputTemplate = outputTemplate.replaceAll(placeholder, value);
  });

  return outputTemplate;
};
