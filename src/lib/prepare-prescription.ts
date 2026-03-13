import dayjs, { formatDate } from "@lib/day-utils";
import { renderLiquidTemplate } from "./liquid-template";

const UNIT_SINGULAR_MAP: Record<string, string> = {
  tablets: "tablet",
  capsules: "capsule",
  ml: "ml",
  mg: "mg",
  g: "g",
  drops: "drop",
  sachets: "sachet",
  vials: "vial",
  patches: "patch",
  syringes: "syringe",
  bottles: "bottle",
  tubes: "tube",
};

const applyOriginalCase = (source: string, target: string): string => {
  if (source === source.toUpperCase()) {
    return target.toUpperCase();
  }

  if (source === source.toLowerCase()) {
    return target.toLowerCase();
  }

  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }

  return target;
};

const formatUnitForQuantity = (unit: string | null, quantity: number | null): string | null => {
  if (!unit) return null;

  const trimmedUnit = unit.trim();
  if (quantity !== 1) {
    return trimmedUnit;
  }

  const lowerUnit = trimmedUnit.toLowerCase();
  const mappedSingular = UNIT_SINGULAR_MAP[lowerUnit];

  if (mappedSingular) {
    return applyOriginalCase(trimmedUnit, mappedSingular);
  }

  if (/s$/i.test(trimmedUnit)) {
    const fallback = trimmedUnit.replace(/s$/i, "");
    return fallback.length > 0 ? fallback : trimmedUnit;
  }

  return trimmedUnit;
};


type Medicine = {
  name: string;
  dosage: string | null;
  unit: string | null;
  frequency: string | null;
  duration: string | null;
  qty: number | null;
  notes: string | null;
};

type PreparePrescriptionPayload = {
  template: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    address: string;
  };
  prescription: {
    medicines: Medicine[];
    remarks: string;
    createdAt: Date | string;
  };
  doctor: {
    name: string;
    licenseNo: string;
    ptrNo: string;
    address: string;
    eSignatureBase64?: string;
  };
};

export const preparePrescription = (payload: PreparePrescriptionPayload): string => {
  const { template, patient, prescription, doctor } = payload;
  const { name: patientName, age, gender, address } = patient;
  const { medicines, createdAt } = prescription;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;

  const signaturePlaceholderUsedAsUrl = [
    /src\s*=\s*"@\{eSignatureUrl\}"/i,
    /src\s*=\s*'@\{eSignatureUrl\}'/i,
    /url\(\s*"@\{eSignatureUrl\}"\s*\)/i,
    /url\(\s*'@\{eSignatureUrl\}'\s*\)/i,
  ].some((pattern) => pattern.test(template));

  const signatureMarkup = eSignatureBase64
    ? signaturePlaceholderUsedAsUrl
      ? eSignatureBase64
      : `<img src="${eSignatureBase64}" alt="Doctor e-signature" style="max-height: 96px;" />`
    : "";

  const requestDate = formatDate(createdAt, "MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MMMM DD, YYYY h:mm A");
  // First letter of gender
  const genderInitial = (typeof gender === "string" && gender.length > 0) ? gender.charAt(0).toUpperCase() : "N/A";

  // Build structured medicine objects for Liquid array rendering
  const medicinesArray = medicines.map((med, i) => {
    const dosageParts = [med.name];
    if (med.dosage) {
      const unitLabel = formatUnitForQuantity(med.unit, med.qty ?? null);
      dosageParts.push(unitLabel ? `${med.dosage} ${unitLabel}` : med.dosage);
    }
    if (med.qty) {
      dosageParts.push(`#${med.qty}`);
    }
    return {
      index: i + 1,
      name: med.name,
      dosage: med.dosage ?? "",
      unit: med.unit ?? "",
      qty: med.qty ?? 0,
      sig: med.notes ?? "",
      label: dosageParts.join(" "),
    };
  });

  // Legacy HTML string kept for backward-compatible templates that use {{ medicine }}
  const medicineLegacyHtml = medicinesArray
    .map((med) => `${med.index}.) ${med.label}${med.sig ? `<br/>Sig: ${med.sig}` : ""}`)
    .join("<br/><br/>");

  const variables = {
    name: patientName,
    age,
    gender: genderInitial,
    address,
    requestDate,
    medicines: medicinesArray,
    medicine: medicines.length === 0 ? "" : medicineLegacyHtml,
    eSignatureUrl: signatureMarkup,
    doctorName,
    licenseNo: licenseNo || "N/A",
    ptrNo: ptrNo || "N/A",
    doctorAddress: doctorAddress || "N/A",
    createdDateTime,
  };

  return renderLiquidTemplate(template, variables);
}; 