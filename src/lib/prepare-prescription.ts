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

// Maximum number of medicines rendered on a single prescription page.
// When a prescription exceeds this limit the output is split into multiple
// pages, each repeating the full template (header + footer), so that the
// medicine list never overflows into the signature / doctor section.
const MEDICINES_PER_PAGE = 7;

const DEFAULT_PRESCRIPTION_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5; background: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">{{ doctorName }}</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">{{ doctorAddress }}</p>
    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">License No: {{ licenseNo }} &nbsp;|&nbsp; PTR No: {{ ptrNo }}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <tr>
      <td style="padding: 4px 0; width: 60%;"><strong>Patient Name:</strong> {{ name }}</td>
      <td style="padding: 4px 0; text-align: right;"><strong>Date:</strong> {{ requestDate }}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Address:</strong> {{ address }}</td>
      <td style="padding: 4px 0; text-align: right;"><strong>Age / Sex:</strong> {{ age }} yrs / {{ gender }}</td>
    </tr>
  </table>

  <div style="margin-bottom: 30px; min-height: 250px;">
    <div style="font-size: 38px; font-weight: bold; font-family: Georgia, serif; color: #0284c7; margin-bottom: 12px;">Rx</div>
    <div style="font-size: 14px; line-height: 1.8; padding-left: 10px;">
      {{ medicine }}
    </div>
  </div>

  <div style="display: flex; justify-content: flex-end; margin-top: 40px; page-break-inside: avoid;">
    <div style="text-align: center; min-width: 220px;">
      <div style="min-height: 70px; display: flex; align-items: center; justify-content: center;">
        {{ eSignatureUrl }}
      </div>
      <div style="border-top: 1px solid #334155; padding-top: 6px; font-size: 14px; font-weight: 700; color: #0f172a;">
        {{ doctorName }}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        Lic. No: {{ licenseNo }}
      </div>
    </div>
  </div>
</div>
`;

export const preparePrescription = (payload: PreparePrescriptionPayload): string => {
  const { template, patient, prescription, doctor } = payload;
  const { name: patientName, age, gender, address } = patient;
  const { medicines, createdAt } = prescription;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;

  const rawTemplate = (template || "").trim();
  const hasPlaceholders = Boolean(
    rawTemplate &&
    (rawTemplate.includes("{{") || rawTemplate.includes("@{") || rawTemplate.toLowerCase().includes("medicine"))
  );

  const effectiveTemplate = hasPlaceholders
    ? rawTemplate
    : DEFAULT_PRESCRIPTION_TEMPLATE;

  const signaturePlaceholderUsedAsUrl = [
    // Legacy @{} syntax inside src attributes / CSS url()
    /src\s*=\s*"@\{eSignatureUrl\}"/i,
    /src\s*=\s*'@\{eSignatureUrl\}'/i,
    /url\(\s*"@\{eSignatureUrl\}"\s*\)/i,
    /url\(\s*'@\{eSignatureUrl\}'\s*\)/i,
    // Liquid {{ eSignatureUrl }} syntax inside src attributes / CSS url()
    /src\s*=\s*"\{\{-?\s*eSignatureUrl\s*-?\}\}"/i,
    /src\s*=\s*'\{\{-?\s*eSignatureUrl\s*-?\}\}'/i,
    /url\(\s*"\{\{-?\s*eSignatureUrl\s*-?\}\}"\s*\)/i,
    /url\(\s*'\{\{-?\s*eSignatureUrl\s*-?\}\}'\s*\)/i,
    /url\(\s*\{\{-?\s*eSignatureUrl\s*-?\}\}\s*\)/i,
  ].some((pattern) => pattern.test(effectiveTemplate));

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

  // Shared scalar variables that are the same on every page
  const baseVariables = {
    name: patientName,
    age,
    gender: genderInitial,
    address,
    requestDate,
    eSignatureUrl: signatureMarkup,
    doctorName,
    licenseNo: licenseNo || "N/A",
    ptrNo: ptrNo || "N/A",
    doctorAddress: doctorAddress || "N/A",
    createdDateTime,
  };

  // Render one page of the template with the given medicines slice
  const renderPage = (pageMedicines: typeof medicinesArray) => {
    const medicineLegacyHtml = pageMedicines
      .map((med) => `${med.index}.) ${med.label}${med.sig ? `<br/>Sig: ${med.sig}` : ""}`)
      .join("<br/><br/>");

    return renderLiquidTemplate(effectiveTemplate, {
      ...baseVariables,
      medicines: pageMedicines,
      medicine: pageMedicines.length === 0 ? "" : medicineLegacyHtml,
    });
  };

  // Paginate: each page holds at most MEDICINES_PER_PAGE entries so that a long
  // medicine list does not overflow the signature / doctor section at the bottom.
  // Each page repeats the full template (header + footer) with its own subset.

  if (medicinesArray.length <= MEDICINES_PER_PAGE) {
    return renderPage(medicinesArray);
  }

  const pages: string[] = [];
  for (let startIndex = 0; startIndex < medicinesArray.length; startIndex += MEDICINES_PER_PAGE) {
    pages.push(renderPage(medicinesArray.slice(startIndex, startIndex + MEDICINES_PER_PAGE)));
  }

  return pages.join('<div style="break-before:page;page-break-before:always;"></div>');
};

// ---------------------------------------------------------------------------
// Variable schema — exported so document-template-schema.ts can build the
// registry dynamically without duplicating the variable list here.
// ---------------------------------------------------------------------------
import type { TemplateVariableSchema } from "./document-template-schema";

export const TEMPLATE_VARIABLE_SCHEMA: TemplateVariableSchema & { key: string } = {
  key: "prescription",
  description: "Variables available in Prescription templates",
  variables: [
    { variable: "name", description: "Patient's full name" },
    { variable: "age", description: "Patient's age" },
    { variable: "gender", description: "Patient's gender initial (M/F)" },
    { variable: "address", description: "Patient's home address" },
    { variable: "requestDate", description: "Date the prescription was created (MM/DD/YYYY)" },
    { variable: "createdDateTime", description: "Full date and time (MMMM DD, YYYY h:mm A)" },
    {
      variable: "medicines",
      type: "array-of-objects" as const,
      loopVar: "med",
      description: "Array of prescribed medicines — iterate with {% for med in medicines %}",
      properties: [
        { variable: "index", description: "Item number (1, 2, 3…)" },
        { variable: "name", description: "Medicine name" },
        { variable: "dosage", description: "Dosage amount (e.g. 500 mg)" },
        { variable: "unit", description: "Unit (e.g. capsules, tablets)" },
        { variable: "qty", description: "Quantity (number)" },
        { variable: "sig", description: "Patient directions / sig instructions" },
        { variable: "label", description: "Formatted: name + dosage + #qty" },
      ],
    },
    { variable: "medicine", type: "html" as const, description: "Legacy: pre-formatted HTML list of all medicines (for older templates)" },
    { variable: "doctorName", description: "Prescribing doctor's full name" },
    { variable: "licenseNo", description: "Doctor's PRC license number" },
    { variable: "ptrNo", description: "Doctor's PTR number" },
    { variable: "doctorAddress", description: "Doctor's clinic or office address" },
    { variable: "eSignatureUrl", type: "html" as const, description: "Doctor's e-signature (<img> tag, or raw base64 URL when used inside src=\"\")" },
  ],
}; 