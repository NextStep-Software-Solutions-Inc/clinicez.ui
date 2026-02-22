import dayjs from "@/lib/day-utils";

type PrepareHeartStationRequestPayload = {
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
  request: {
    diagnostics: string;
    history: string;
    impression: string;
    requestFor: string;
    createdAt: Date | string;
  };
};

export const prepareHeartStationRequest = (payload: PrepareHeartStationRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;
  const { diagnostics, history, impression, requestFor, createdAt } = request;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  const replacements: Record<string, string> = {
    "@{name}": name,
    "@{age}": age,
    "@{gender}": gender,
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
    "@{eSignatureUrl}": eSignatureBase64 || "",
  };

  let outputTemplate = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    outputTemplate = outputTemplate.replaceAll(placeholder, value);
  });

  return outputTemplate;
};
