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

// ---------------------------------------------------------------------------
// Per-page A4 layout styles
// ---------------------------------------------------------------------------
// Each rendered page is wrapped in <div class="rx-page">.  Template authors
// should add these CSS classes to their HTML sections to get the correct
// A4 print layout:
//
//   .rx-header    – clinic / doctor info at the top  (stays at the top)
//   .rx-content   – medicines list area (expands to fill space; vertically
//                   centres its children between header and signatory)
//   .rx-signatory – doctor signature / credentials   (pinned above footer)
//   .rx-footer    – footer text / serial number      (stays at the bottom)
//
// Without these classes the page still renders; elements just flow normally.
// ---------------------------------------------------------------------------
const PAGE_LAYOUT_STYLES = `<style>
/*
 * The @page margins (15 mm top + 15 mm bottom) are injected by
 * injectPrintStyles() in src/lib/print-pdf.tsx.  The min-height here
 * (267 mm) is derived from A4 height (297 mm) minus those margins.
 */
:root {
  --rx-page-height: 267mm;
}
.rx-page {
  display: flex;
  flex-direction: column;
  min-height: var(--rx-page-height);
  box-sizing: border-box;
}
.rx-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rx-signatory {
  margin-top: auto;
}
@media print {
  .rx-page {
    min-height: var(--rx-page-height);
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
</style>`;

/** Wraps a single rendered prescription page in the A4 layout container. */
const wrapInPageLayout = (renderedHtml: string): string =>
  `<div class="rx-page">${renderedHtml}</div>`;

export const preparePrescription = (payload: PreparePrescriptionPayload): string => {
  const { template, patient, prescription, doctor } = payload;
  const { name: patientName, age, gender, address } = patient;
  const { medicines, createdAt } = prescription;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 } = doctor;

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

    return renderLiquidTemplate(template, {
      ...baseVariables,
      medicines: pageMedicines,
      medicine: pageMedicines.length === 0 ? "" : medicineLegacyHtml,
    });
  };

  // Paginate: each page holds at most MEDICINES_PER_PAGE entries so that a long
  // medicine list does not overflow the signature / doctor section at the bottom.
  // Each page repeats the full template (header + footer) with its own subset.
  // Every page is wrapped in .rx-page which enforces the A4 flex-column layout.

  if (medicinesArray.length <= MEDICINES_PER_PAGE) {
    return PAGE_LAYOUT_STYLES + wrapInPageLayout(renderPage(medicinesArray));
  }

  const pages: string[] = [];
  for (let startIndex = 0; startIndex < medicinesArray.length; startIndex += MEDICINES_PER_PAGE) {
    pages.push(wrapInPageLayout(renderPage(medicinesArray.slice(startIndex, startIndex + MEDICINES_PER_PAGE))));
  }

  return PAGE_LAYOUT_STYLES + pages.join('<div style="break-before:page;page-break-before:always;"></div>');
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