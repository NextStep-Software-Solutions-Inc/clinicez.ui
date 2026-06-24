"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"
import { getClinicKonsultaCredentials } from "./konsulta-report.action"
import { KONSULTA_TICKET_INCLUDE, assemblePcbData } from "@/services/konsulta/v2/data-assembler"
import { buildPcbXml } from "@/services/konsulta/v2/pcb-xml-builder-v2"
import { generateKonsultaCaseNo, generateKonsultaTransNo, getNextKonsultaSequence } from "@/services/konsulta/konsulta-utils"
import { validatePcbXmlData } from "@/services/konsulta/v2/xml-validator"

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

  if (consultationIds.size === 0 && batch.reportTagging === "2") {
    throw new Error("No consultations selected for this batch.")
  }

  // Fetch the full consultation tickets
  const tickets: any[] = await prisma.consultationTicket.findMany({
    where: { id: { in: Array.from(consultationIds) } },
    include: KONSULTA_TICKET_INCLUDE
  })

  // For Tagging 1 (Enlistment/Profiling), we can submit patients who don't have a consultation yet.
  if (batch.reportTagging === "1") {
    for (const entry of batch.KonsultaEntries) {
      if (entry.included && (!entry.consultationIds || entry.consultationIds.length === 0)) {
        // Fetch patient
        const clinicPatient = await prisma.clinicPatient.findFirst({
          where: { clinicId: batch.clinicId, patientId: entry.patientUserId },
          include: {
            Patient: { include: { PhilHealthRecords: true } },
            YakapRegistrations: {
              where: { effYear: batch.period.substring(0, 4) },
              take: 1
            }
          }
        });
        
        if (clinicPatient && clinicPatient.Patient) {
          // As per PhilHealth rules: Every patient registration is a transaction, every patient created is a case.
          // Therefore, we use the registration date (clinicPatient.createdAt) for the YYYYMM part of the Case/Trans numbers.
          const regDate = clinicPatient.createdAt;
          
          // Use the persisted Case and Transaction numbers from the patient's registration.
          // If they don't exist yet, fetch the next sequence from the database.
          const reg = clinicPatient.YakapRegistrations?.[0];
          let fakeCaseNo = reg?.hciCaseNo;
          let fakeTransNo = reg?.hciProfilingTransNo || reg?.hciEnlistmentTransNo;
          
          if (!fakeCaseNo || !fakeTransNo) {
            const caseSequence = await getNextKonsultaSequence(prisma, "KONSULTA_CASE_T", batch.clinicId, regDate);
            const transSequence = await getNextKonsultaSequence(prisma, "KONSULTA_TRANS_P", batch.clinicId, regDate);
            
            fakeCaseNo = fakeCaseNo || generateKonsultaCaseNo(credentials.hciAccreNo, regDate, caseSequence, "T");
            fakeTransNo = fakeTransNo || generateKonsultaTransNo(credentials.hciAccreNo, regDate, transSequence, "P");
          }
          
          tickets.push({
            id: -entry.id, // fake negative ID
            clinicPatientId: clinicPatient.id,
            soapTransNo: fakeTransNo,
            konsultaIsWalkedIn: false,
            konsultaCoPay: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            ClinicPatient: clinicPatient,
            ConsultationKonsultaData: {
              patientType: reg?.patientType === "DD" ? "DEPENDENT" : "MEMBER",
              memPin: reg?.memberPin || clinicPatient.memberPin,
              packageType: "K",
              enlistStat: "1",
              enlistDate: new Date(),
              effYear: batch.period.substring(0, 4)
            }
          });
        }
      }
    }
  }

  if (tickets.length === 0) {
    throw new Error("No entries selected for this batch.");
  }

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

  // Note: Validation is now a separate action.
  // We proceed directly to XML generation.

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
    include: {
      Patient: { include: { PhilHealthRecords: true } },
      YakapRegistrations: {
        where: { effYear: period.substring(0, 4) },
        take: 1
      }
    }
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

  // For Tagging 1, if a patient has NO consultations in the period, fetch their latest consultation
  if (reportTagging === "1") {
    for (const cp of eligibleClinicPatients) {
      if (!cp.Patient) continue;
      const pid = cp.Patient.id;
      if (!consultationsByPatient.has(pid) || consultationsByPatient.get(pid)!.length === 0) {
        // Fetch latest consultation
        const latestConsultation = await prisma.consultationTicket.findFirst({
          where: { clinicPatientId: cp.id, isActive: true, isArchived: false },
          orderBy: { createdAt: "desc" },
          include: { ConsultationKonsultaData: true }
        });
        if (latestConsultation) {
          if (!consultationsByPatient.has(pid)) consultationsByPatient.set(pid, []);
          consultationsByPatient.get(pid)!.push(latestConsultation.id);
          periodConsultations.push(latestConsultation);
        }
      }
    }
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

      const reg = cp.YakapRegistrations?.[0];
      entriesData.push({
        batchId: newBatch.id,
        patientUserId: patientId,
        philHealthPin: cp.patientPin || ph?.pin || "000000000000",
        memberPin: cp.memberPin || cp.patientPin || ph?.pin || "000000000000",
        memberType: reg?.patientType === "DD" || reg?.patientType === "DEPENDENT" ? "DD" : "MM",
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
