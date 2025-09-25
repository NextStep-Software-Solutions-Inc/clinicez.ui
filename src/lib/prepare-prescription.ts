import dayjs from "@lib/day-utils";

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
  "@{createdDateTime}"
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
  const { medicines, remarks, createdAt } = prescription;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;

  const requestDate = dayjs(createdAt).format("MMMM DD, YYYY");
  const createdDateTime = dayjs(createdAt).format("MMMM DD, YYYY h:mm A");
  // First letter of gender
  const genderInitial = (typeof gender === "string" && gender.length > 0) ? gender.charAt(0).toUpperCase() : "N/A";

  const medicineList = medicines.map(medicine => {
    const parts = [medicine.name];

    if (medicine.dosage && medicine.unit) {
      parts.push(` ${medicine.dosage} ${medicine.unit}`);
    } else if (medicine.dosage) {
      parts.push(` ${medicine.dosage}`);
    }

    if (medicine.frequency) {
      parts.push(medicine.frequency);
    }

    if (medicine.duration) {
      const durationNum = Number(medicine.duration);
      const dayLabel = durationNum === 1 ? "day" : "days";
      parts.push(`for ${medicine.duration} ${isNaN(durationNum) ? "day(s)" : dayLabel}`);
    }

    const medicineLine = parts.join(' ');
    const sig = medicine.notes ? `<br/>Sig: ${medicine.notes}` : '';

    return `${medicineLine}${sig}`;
  }).join('<br/><br/>');
  const replacements = {
    "@{name}": patientName,
    "@{age}": age,
    "@{gender}": genderInitial,
    "@{address}": address,
    "@{requestDate}": requestDate,
    "@{medicine}": medicines.length === 0 ? "No medicines prescribed." : medicineList,
    "@{sig}": remarks || "No special instructions.",
    "@{eSignatureUrl}": eSignatureBase64 || "",
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