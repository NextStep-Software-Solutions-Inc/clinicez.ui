import defaultPrisma from "@/lib/prisma";
import type { DocumentTemplate } from "@prisma/client";

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

  // 1. Check Prescription Setting
  if (category === "prescription") {
    const rxSetting = await prisma.clinicPrescriptionSetting.findFirst({
      where: { clinicId },
      select: { prescriptionTemplateId: true },
    });
    if (rxSetting?.prescriptionTemplateId) {
      return rxSetting.prescriptionTemplateId;
    }
  }

  // 2. Check ClinicDocumentDefaultTemplate
  const defaultEntry = await prisma.clinicDocumentDefaultTemplate.findFirst({
    where: {
      clinicId,
      DocumentType: {
        name: { in: aliases, mode: "insensitive" },
      },
    },
    select: { templateId: true },
  });
  if (defaultEntry?.templateId) {
    return defaultEntry.templateId;
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

/**
 * Returns the effective DocumentTemplate entity for rendering/previewing.
 * Prioritizes the clinic's configured default template; falls back to the record's existing template.
 */
export async function resolveClinicEffectiveTemplate<T = DocumentTemplate>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any = defaultPrisma,
  clinicId: number,
  category: DocumentCategory,
  fallbackTemplate?: T | null
): Promise<T | null> {
  const aliases = TYPE_ALIASES[category] ?? [category];

  // Check prescription setting
  if (category === "prescription") {
    const rxSetting = await prisma.clinicPrescriptionSetting.findFirst({
      where: { clinicId },
      include: { PrescriptionTemplate: true },
    });
    if (rxSetting?.PrescriptionTemplate && rxSetting.PrescriptionTemplate.isActive) {
      return rxSetting.PrescriptionTemplate as unknown as T;
    }
  }

  // Check ClinicDocumentDefaultTemplate
  const defaultEntry = await prisma.clinicDocumentDefaultTemplate.findFirst({
    where: {
      clinicId,
      DocumentType: {
        name: { in: aliases, mode: "insensitive" },
      },
    },
    include: { Template: true },
  });

  if (defaultEntry?.Template && defaultEntry.Template.isActive) {
    return defaultEntry.Template as unknown as T;
  }

  return fallbackTemplate ?? null;
}

/**
 * Synchronizes existing clinic records to use the currently configured default templates.
 */
export async function syncClinicRecordsTemplates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any = defaultPrisma,
  clinicId: number
): Promise<void> {
  // 1. Prescription
  const rxSetting = await prisma.clinicPrescriptionSetting.findFirst({
    where: { clinicId },
    select: { prescriptionTemplateId: true },
  });
  if (rxSetting?.prescriptionTemplateId) {
    await prisma.prescription.updateMany({
      where: { clinicId, isActive: true },
      data: { templateId: rxSetting.prescriptionTemplateId },
    });
  }

  // 2. Document defaults
  const defaults = await prisma.clinicDocumentDefaultTemplate.findMany({
    where: { clinicId },
    include: {
      DocumentType: { select: { name: true } },
    },
  });

  for (const item of defaults) {
    if (!item.templateId || !item.DocumentType?.name) continue;
    const name = item.DocumentType.name.toLowerCase();

    if (name === "laboratory" || name === "diagnostic_request") {
      await prisma.clinicLaboratoryRequest.updateMany({
        where: { clinicId, isActive: true },
        data: { documentTemplateId: item.templateId },
      });
    } else if (name === "imaging" || name === "imaging_study") {
      await prisma.clinicImagingRequest.updateMany({
        where: { clinicId, isActive: true },
        data: { documentTemplateId: item.templateId },
      });
    } else if (name === "heart_station" || name === "heart-station" || name === "heart station") {
      await prisma.clinicHeartStationRequest.updateMany({
        where: { clinicId, isActive: true },
        data: { documentTemplateId: item.templateId },
      });
    } else if (name === "medcert" || name === "medical_certificate" || name === "medical-certificate") {
      await prisma.clinicMedicalCertificate.updateMany({
        where: { clinicId, isActive: true },
        data: { documentTemplateId: item.templateId },
      });
    } else if (name === "referral" || name === "referral_slip" || name === "referral-slip") {
      await prisma.clinicReferralSlip.updateMany({
        where: { clinicId, isActive: true },
        data: { documentTemplateId: item.templateId },
      });
    } else if (name === "prescription") {
      await prisma.prescription.updateMany({
        where: { clinicId, isActive: true },
        data: { templateId: item.templateId },
      });
    }
  }
}
