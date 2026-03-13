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
