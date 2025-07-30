import dayjs from "@lib/day-utils";

// Pre-compiled regex for template placeholder replacement
// This regex matches all possible placeholders used in referral slip templates
const PLACEHOLDER_REGEX = /@\{(?:date|createdDateTime|patientName|age|sex|dob|address|referredToSpecialty|chiefComplaint|briefHistory|impression|recommendation|reasonForReferral|referredBy)\}/g;

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

  const outputTemplate = template.replace(
    PLACEHOLDER_REGEX,
    (match) => replacements[match as keyof typeof replacements] ?? "[MISSING VALUE]"
  );

  return outputTemplate;
};
