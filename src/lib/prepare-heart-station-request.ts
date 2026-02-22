import dayjs from "@lib/day-utils";

type PrepareHeartStationRequestPayload = {
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
  request: {
    procedures: string;
    impression: string;
    others: string;
    createdAt: Date | string;
  };
};

export const prepareHeartStationRequest = (payload: PrepareHeartStationRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address } = patient;
  const { name: doctorName, licenseNo, ptrNo, eSignatureBase64 } = doctor;
  const { procedures, impression, others, createdAt } = request;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  const replacements: Record<string, string> = {
    "@{name}": name,
    "@{age}": age,
    "@{gender}": gender,
    "@{address}": address,
    "@{requestDate}": requestDate,
    "@{procedures}": procedures,
    "@{impression}": impression || "No impression provided.",
    "@{others}": others || "",
    "@{doctorName}": doctorName,
    "@{licenseNo}": licenseNo,
    "@{ptrNo}": ptrNo,
    "@{eSignatureUrl}": eSignatureBase64 || "",
    "@{createdDateTime}": createdDateTime,
  };

  let output = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    output = output.replaceAll(placeholder, value);
  });
  return output;
};
