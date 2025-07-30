import dayjs from "@lib/day-utils";

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

  const replacements = {
    "@{date}": createdDate,
    "@{createdDateTime}": createdDateTime,
    "@{patientName}": patientName,
    "@{age}": age,
    "@{sex}": sex,
    "@{dob}": dob,
    "@{address}": address,
    "@{referredToSpecialty}": referredToSpecialty,
    "@{chiefComplaint}": chiefComplaint || "No chief complaint provided.",
    "@{briefHistory}": briefHistory || "No brief history provided.",
    "@{impression}": impression || "No impression provided.",
    "@{recommendation}": recommendation || "No recommendation provided.",
    "@{reasonForReferral}": reasonForReferral || "No reason provided.",
    "@{referredBy}": referredBy,
  };

  const placeholderRegex = new RegExp(Object.keys(replacements).map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const outputTemplate = template.replace(
    placeholderRegex,
    (match) => replacements[match as keyof typeof replacements]
  );

  return outputTemplate;
};
