import defaultPrisma from "@/lib/prisma";

export type DocumentCategory =
  | "prescription"
  | "laboratory"
  | "imaging"
  | "heart_station"
  | "medical_certificate"
  | "referral";

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
  const key = documentKey.trim();

  // 1. Check ClinicDocumentDefaultTemplate (configured default template stored in settings)
  const defaultEntry = await prisma.clinicDocumentDefaultTemplate.findFirst({
    where: {
      clinicId,
      DocumentType: {
        OR: [
          { name: { equals: key, mode: "insensitive" } },
          { name: { equals: key.replace(/_/g, " "), mode: "insensitive" } },
          { name: { equals: key.replace(/\s+/g, "_"), mode: "insensitive" } },
        ],
      },
    },
    orderBy: { id: "desc" },
    select: { templateId: true },
  });
  if (defaultEntry?.templateId) {
    return defaultEntry.templateId;
  }

  // 2. Fallback for prescription: ClinicPrescriptionSetting
  if (key.toLowerCase().replace(/[\s-]+/g, "_") === "prescription") {
    const rxSetting = await prisma.clinicPrescriptionSetting.findFirst({
      where: { clinicId },
      orderBy: { id: "desc" },
      select: { prescriptionTemplateId: true },
    });
    if (rxSetting?.prescriptionTemplateId) {
      return rxSetting.prescriptionTemplateId;
    }
  }

  // 3. Fallback: Clinic-scoped active template matching the document key
  const clinicTemplate = await prisma.documentTemplate.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      clinicId,
      DocumentTemplateType: {
        OR: [
          { name: { equals: key, mode: "insensitive" } },
          { name: { equals: key.replace(/_/g, " "), mode: "insensitive" } },
          { name: { equals: key.replace(/\s+/g, "_"), mode: "insensitive" } },
        ],
      },
    },
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
        OR: [
          { name: { equals: key, mode: "insensitive" } },
          { name: { equals: key.replace(/_/g, " "), mode: "insensitive" } },
          { name: { equals: key.replace(/\s+/g, "_"), mode: "insensitive" } },
        ],
      },
    },
    select: { id: true },
  });
  if (globalTemplate?.id) {
    return globalTemplate.id;
  }

  throw new Error(`No document template found for document key: ${documentKey}`);
}

