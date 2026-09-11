import defaultPrisma from "@/lib/prisma";

export type DocumentCategory =
  | "prescription"
  | "laboratory"
  | "imaging"
  | "heart_station"
  | "medcert"
  | "referral";

const TYPE_ALIASES: Record<DocumentCategory, string[]> = {
  prescription: ["prescription"],
  laboratory: ["laboratory", "diagnostic_request"],
  imaging: ["imaging", "imaging_study"],
  heart_station: ["heart_station", "heart-station", "heart station"],
  medcert: ["medcert", "medical_certificate", "medical-certificate"],
  referral: ["referral", "referral_slip", "referral-slip"],
};

/**
 * Resolves the configured default template ID for a clinic.
 * Priority:
 * 1. ClinicPrescriptionSetting (if prescription) or ClinicDocumentDefaultTemplate
 * 2. Scoped active DocumentTemplate for this clinic
 * 3. Any active DocumentTemplate matching the category
 */
export async function resolveClinicTemplateId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any = defaultPrisma,
  clinicId: number,
  category: DocumentCategory
): Promise<number> {
  const aliases = TYPE_ALIASES[category] ?? [category];

  // 1. Check ClinicDocumentDefaultTemplate (unified v2 default template setting)
  const defaultEntry = await prisma.clinicDocumentDefaultTemplate.findFirst({
    where: {
      clinicId,
      DocumentType: {
        name: { in: aliases, mode: "insensitive" },
      },
    },
    orderBy: { id: "desc" },
    select: { templateId: true },
  });
  if (defaultEntry?.templateId) {
    return defaultEntry.templateId;
  }

  // 2. Fallback for prescription: ClinicPrescriptionSetting
  if (category === "prescription") {
    const rxSetting = await prisma.clinicPrescriptionSetting.findFirst({
      where: { clinicId },
      orderBy: { id: "desc" },
      select: { prescriptionTemplateId: true },
    });
    if (rxSetting?.prescriptionTemplateId) {
      return rxSetting.prescriptionTemplateId;
    }
  }

  // 3. Fallback: Clinic-scoped active template
  const clinicTemplate = await prisma.documentTemplate.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      clinicId,
      DocumentTemplateType: {
        name: { in: aliases, mode: "insensitive" },
      },
    },
    select: { id: true },
  });
  if (clinicTemplate?.id) {
    return clinicTemplate.id;
  }

  // 4. Global active template fallback
  const globalTemplate = await prisma.documentTemplate.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      DocumentTemplateType: {
        name: { in: aliases, mode: "insensitive" },
      },
    },
    select: { id: true },
  });
  if (globalTemplate?.id) {
    return globalTemplate.id;
  }

  throw new Error(`No document template found for document type: ${category}`);
}

