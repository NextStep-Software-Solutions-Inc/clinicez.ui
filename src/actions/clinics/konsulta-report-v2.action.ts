"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"
import { getClinicKonsultaCredentials } from "./konsulta-report.action"
import { KONSULTA_TICKET_INCLUDE, assemblePcbData } from "@/services/konsulta/v2/data-assembler"
import { validatePcbXmlData } from "@/services/konsulta/v2/xml-validator"
import { buildPcbXml } from "@/services/konsulta/v2/pcb-xml-builder-v2"

/**
 * Generates the V2 XML Payload for a given batch.
 */
export const generateBatchXmlV2Action = withErrorHandling(async (batchUid: string) => {
  const batch = await prisma.konsultaBatch.findUnique({
    where: { batchUid },
    include: {
      KonsultaEntries: true
    }
  })

  if (!batch) throw new Error("Batch not found")
  if (batch.status === "SUBMITTED") throw new Error("Batch is already submitted")

  const credentials = await getClinicKonsultaCredentials(batch.clinicId)

  // Get all unique consultation IDs included in this batch
  const consultationIds = new Set<number>()
  for (const entry of batch.KonsultaEntries) {
    if (entry.included && entry.consultationIds) {
      entry.consultationIds.forEach(id => consultationIds.add(id))
    }
  }

  if (consultationIds.size === 0) {
    throw new Error("No consultations selected for this batch.")
  }

  // Fetch the full consultation tickets
  const tickets = await prisma.consultationTicket.findMany({
    where: { id: { in: Array.from(consultationIds) } },
    include: KONSULTA_TICKET_INCLUDE
  })

  // Assemble Data
  const ctx = {
    pUsername: credentials.username,
    pPassword: credentials.password,
    pHciAccreNo: credentials.hciAccreNo,
    pPMCCNo: credentials.pmccNumber,
    pCertificationId: credentials.certificationId,
    pHciTransmittalNumber: batch.transmittalNo || `T-${batch.period}-${batch.id}`
  }

  // V2 uses strict reportTagging type ("1" or "2")
  const tagging = batch.reportTagging === "1" ? "1" : "2"
  
  const pcbData = assemblePcbData(tickets, ctx, tagging)

  // Validate fields
  const validationErrors = validatePcbXmlData(pcbData)
  if (validationErrors.length > 0) {
    const errorMsg = validationErrors.map(e => `${e.path}: ${e.message}`).join(", ")
    throw new Error(`XML Validation Failed: ${errorMsg}`)
  }

  // Build XML string
  const xmlPayload = buildPcbXml(pcbData)

  // Save XML payload to batch
  const updatedBatch = await prisma.konsultaBatch.update({
    where: { id: batch.id },
    data: {
      xmlPayload,
      transmittalNo: ctx.pHciTransmittalNumber,
      status: "GENERATED",
      errorMessage: null
    }
  })

  return { 
    message: "XML Generated Successfully using V2 Builder", 
    data: { transmittalNo: updatedBatch.transmittalNo } 
  }
})

export const createKonsultaBatchV2Action = withErrorHandling(async ({
  clinicUid,
  period,
  reportTagging,
  notes,
  patientUserIds,
}: {
  clinicUid: string;
  period: string; // YYYYMM
  reportTagging: "1" | "2";
  notes: string;
  patientUserIds: number[];
}) => {
  const clinic = await prisma.clinic.findUnique({ where: { clinicUid } })
  if (!clinic) throw new Error("Clinic not found")

  // Check for duplicate period/tagging draft batches
  const existingDraft = await prisma.konsultaBatch.findFirst({
    where: { clinicId: clinic.id, period, reportTagging, status: "DRAFT" }
  })

  if (existingDraft) {
    throw new Error(`A draft batch for period ${period} (Tagging ${reportTagging}) already exists. Please delete it first or use it.`)
  }

  // Get eligible ClinicPatient records based on selected patientUserIds
  const eligibleClinicPatients = await prisma.clinicPatient.findMany({
    where: {
      clinicId: clinic.id,
      patientId: { in: patientUserIds },
    },
    include: { Patient: { include: { PhilHealthRecords: true } } }
  });

  const eligibleClinicPatientIds = eligibleClinicPatients.map(cp => cp.id);

  // Fetch relevant consultations for these patients in the period
  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10) - 1;
  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month + 1, 0, 23, 59, 59);

  // Fetch all consultations for the period
  const periodConsultations = await prisma.consultationTicket.findMany({
    where: {
      clinicId: clinic.id,
      isActive: true,
      isArchived: false,
      createdAt: { gte: periodStart, lte: periodEnd },
      clinicPatientId: { in: eligibleClinicPatientIds }
    },
    include: {
      ConsultationKonsultaData: true
    }
  });

  // Group consultation IDs by patientUserId
  const consultationsByPatient = new Map<number, number[]>();
  for (const c of periodConsultations) {
    const cp = eligibleClinicPatients.find(p => p.id === c.clinicPatientId);
    if (!cp || !cp.Patient) continue;
    const pid = cp.Patient.id;
    if (!consultationsByPatient.has(pid)) consultationsByPatient.set(pid, []);
    consultationsByPatient.get(pid)!.push(c.id);
  }

  // Create Batch and Entries in transaction
  const batch = await prisma.$transaction(async (tx) => {
    const newBatch = await tx.konsultaBatch.create({
      data: {
        clinicId: clinic.id,
        period,
        reportTagging,
        notes,
        status: "DRAFT"
      }
    });

    const entriesData = [];

    for (const cp of eligibleClinicPatients) {
      if (!cp.Patient) continue;
      const patientId = cp.Patient.id;
      const cIds = consultationsByPatient.get(patientId) || [];
      const ph = cp.Patient.PhilHealthRecords?.[0];

      // Find the best source for hciCaseNo and memberType: either latest period consultation or previous records.
      // For simplicity, grab first consultation in period if any
      const t = periodConsultations.find(c => c.clinicPatientId === cp.id);
      
      entriesData.push({
        batchId: newBatch.id,
        patientUserId: patientId,
        philHealthPin: cp.konsultaPatientPin || ph?.pin || "000000000000",
        memberPin: cp.konsultaMemberPin || cp.konsultaPatientPin || ph?.pin || "000000000000",
        memberType: cp.konsultaPatientType === "DD" || cp.konsultaPatientType === "DEPENDENT" ? "DD" : "MM",
        hciCaseNo: t?.konsultaHciCaseNo || t?.caseNumber || "",
        hciTransNo: t?.konsultaHciTransNo || "",
        consultationIds: cIds,
      });
    }

    if (entriesData.length > 0) {
      await tx.konsultaEntry.createMany({ data: entriesData });
    }
    return newBatch;
  });

  return { message: "Draft batch created", data: batch };
})
