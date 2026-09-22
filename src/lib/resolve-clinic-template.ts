import defaultPrisma from "@/lib/prisma";

export type DocumentCategory =
  | "prescription"
  | "laboratory"
  | "imaging"
  | "heart_station"
  | "medical_certificate"
  | "medcert"
  | "referral";

export const DOCUMENT_TYPE_ALIASES: Record<string, string[]> = {
  prescription: ["prescription", "rx", "prescriptions"],
  laboratory: [
    "laboratory",
    "lab",
    "diagnostic_request",
    "diagnostic request",
    "diagnostic-request",
    "laboratory_request",
    "laboratory request",
    "laboratory-request",
    "lab_request",
    "lab request",
    "lab-request",
  ],
  imaging: [
    "imaging",
    "imaging_study",
    "imaging study",
    "imaging-study",
    "imaging_request",
    "imaging request",
    "imaging-request",
    "radiology",
  ],
  heart_station: [
    "heart_station",
    "heart-station",
    "heart station",
    "heartstation",
    "ecg",
    "ekg",
  ],
  medcert: [
    "medcert",
    "med_cert",
    "med-cert",
    "med cert",
    "medical_certificate",
    "medical-certificate",
    "medical certificate",
    "medical cert",
    "medical_cert",
    "medical-cert",
    "certificate",
  ],
  referral: [
    "referral",
    "referral_slip",
    "referral-slip",
    "referral slip",
    "referrals",
  ],
};

/**
 * Returns all possible variations and alias names for a document category or key.
 */
export function getDocumentTypeNamesForDocumentKey(
  documentKey: DocumentCategory | string
): string[] {
  const trimmed = documentKey.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, "_");

  for (const [canonicalKey, aliases] of Object.entries(DOCUMENT_TYPE_ALIASES)) {
    if (
      canonicalKey === normalized ||
      aliases.some((a) => a.toLowerCase().replace(/[\s-]+/g, "_") === normalized)
    ) {
      return aliases;
    }
  }

  return [
    trimmed,
    trimmed.replace(/_/g, " "),
    trimmed.replace(/\s+/g, "_"),
    trimmed.replace(/[\s_]+/g, "-"),
  ];
}

/**
 * Checks specifically whether the clinic has configured a default template in settings.
 * Returns the template ID if configured, or null if no default is set.
 */
export async function resolveClinicDefaultTemplateId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any = defaultPrisma,
  clinicId: number,
  documentKey: DocumentCategory | string
): Promise<number | null> {
  const matchingNames = getDocumentTypeNamesForDocumentKey(documentKey);
  const nameOrFilter = matchingNames.map((n) => ({
    name: { equals: n, mode: "insensitive" as const },
  }));

  const defaultEntry = await prisma.clinicDocumentDefaultTemplate.findFirst({
    where: {
      clinicId,
      DocumentType: {
        OR: nameOrFilter,
      },
    },
    orderBy: { id: "desc" },
    select: { templateId: true },
  });

  if (defaultEntry?.templateId) {
    return defaultEntry.templateId;
  }

  const isPrescription = matchingNames.some(
    (n) => n.toLowerCase().includes("prescription") || n.toLowerCase() === "rx"
  );
  if (isPrescription) {
    const rxSetting = await prisma.clinicPrescriptionSetting.findFirst({
      where: { clinicId },
      orderBy: { id: "desc" },
      select: { prescriptionTemplateId: true },
    });
    if (rxSetting?.prescriptionTemplateId) {
      return rxSetting.prescriptionTemplateId;
    }
  }

  return null;
}

/**
 * Resolves the configured default template ID for a clinic using its document key.
 *
 * Priority:
 * 1. ClinicDocumentDefaultTemplate (unified default template configured in settings)
 * 2. ClinicPrescriptionSetting (if prescription)
 * 3. Scoped active DocumentTemplate for this clinic matching the document key
 * 4. Global active DocumentTemplate matching the document key
 */
export async function resolveClinicTemplateId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any = defaultPrisma,
  clinicId: number,
  documentKey: DocumentCategory | string
): Promise<number> {
  // 1 & 2. Check settings default
  const defaultTemplateId = await resolveClinicDefaultTemplateId(
    prisma,
    clinicId,
    documentKey
  );
  if (defaultTemplateId) {
    return defaultTemplateId;
  }

  const matchingNames = getDocumentTypeNamesForDocumentKey(documentKey);
  const nameOrFilter = matchingNames.map((n) => ({
    name: { equals: n, mode: "insensitive" as const },
  }));

  // 3. Fallback: Clinic-scoped active template matching the document key
  const clinicTemplate = await prisma.documentTemplate.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      clinicId,
      DocumentTemplateType: {
        OR: nameOrFilter,
      },
    },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (clinicTemplate?.id) {
    return clinicTemplate.id;
  }

  // 4. Global active template fallback matching the document key
  const globalTemplate = await prisma.documentTemplate.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      DocumentTemplateType: {
        OR: nameOrFilter,
      },
    },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (globalTemplate?.id) {
    return globalTemplate.id;
  }

  throw new Error(`No document template found for document key: ${documentKey}`);
}


