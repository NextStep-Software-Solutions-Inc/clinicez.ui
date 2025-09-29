import dayjs, { formatDate } from "@lib/day-utils";

const PLACEHOLDER_KEYS = [
  "@{name}",
  "@{age}",
  "@{gender}",
  "@{address}",
  "@{requestDate}",
  "@{medicine}",
  "@{sig}",
  "@{doctorName}",
  "@{licenseNo}",
  "@{ptrNo}",
  "@{doctorAddress}",
  "@{createdDateTime}",
  "@{eSignatureUrl}"
] as const;

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PLACEHOLDER_REGEX = new RegExp(
  PLACEHOLDER_KEYS.map(key => escapeRegex(key)).join('|'),
  'g'
);

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

  const medicineList = medicines.map((medicine, i) => {
    const parts = [medicine.name];

    if (medicine.dosage) {
      if (medicine.unit) {
        parts.push(`${medicine.dosage} ${medicine.unit}`);
      } else {
        parts.push(`${medicine.dosage}`);
      }

      if (medicine.qty) {
        parts.push(`#${medicine.qty}`);
      }
    }

    const medicineLine = parts.join(' ');
    const sig = medicine.notes ? `<br/>Sig: ${medicine.notes}` : '';

    return `${i + 1}.) ${medicineLine}${sig}`;
  }).join('<br/><br/>');
  const replacements = {
    "@{name}": patientName,
    "@{age}": age,
    "@{gender}": genderInitial,
    "@{address}": address,
    "@{requestDate}": requestDate,
    "@{medicine}": medicines.length === 0 ? "" : medicineList, // return empty for formal purposes
    "@{eSignatureUrl}": signatureMarkup,
    "@{doctorName}": doctorName,
    "@{licenseNo}": licenseNo || "N/A",
    "@{ptrNo}": ptrNo || "N/A",
    "@{doctorAddress}": doctorAddress || "N/A",
    "@{createdDateTime}": createdDateTime,
  } as const;

  type ReplacementKeys = keyof typeof replacements;

  const outputTemplate = template.replace(
    PLACEHOLDER_REGEX,
    (match) => (match in replacements ? replacements[match as ReplacementKeys] : "Information not available")
  );

  return outputTemplate;
}; 