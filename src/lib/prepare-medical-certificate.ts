import dayjs from "@lib/day-utils";

type PrepareMedicalCertificatePayload = {
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
    address: string;
  };
  certificate: {
    classification: string;
    classificationDescription: string;
    reason: string;
    finding: string;
    recommendations: string;
    impression: string;
    createdAt: Date | string;
  };
};

export const prepareMedicalCertificate = (payload: PrepareMedicalCertificatePayload): string => {
  const { template, patient, doctor, certificate } = payload;
  const { name: patientName, age, gender, address } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress } = doctor;
  const {
    classification,
    classificationDescription,
    reason,
    finding,
    recommendations,
    impression,
    createdAt,
  } = certificate;

  const createdDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  const replacements = {
    "@{createdDate}": createdDate,
    "@{createdDateTime}": createdDateTime,
    "@{patientName}": patientName,
    "@{age}": age,
    "@{gender}": gender,
    "@{address}": address,
    "@{doctorName}": doctorName,
    "@{licenseNo}": licenseNo,
    "@{ptrNo}": ptrNo,
    "@{doctorAddress}": doctorAddress,
    "@{selectedClassification}": classification,
    "@{selectedClassificationDescription}": classificationDescription,
    "@{selectedReason}": reason,
    "@{selectedFinding}": finding,
    "@{recommendations}": recommendations || "No recommendations provided.",
    "@{impression}": impression || "No impressions provided.",
  };

  let outputTemplate = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    outputTemplate = outputTemplate.replaceAll(placeholder, value);
  });

  return outputTemplate;
};
