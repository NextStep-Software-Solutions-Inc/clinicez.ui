"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { YakapApiClient, decryptReport, encryptReport } from "@/lib/philhealth-yakap/api";
import { revalidatePath } from "next/cache";
import { generatePhilHealthKonsultaTransactionNumber } from "@/services/sequence-generator.service";
import { generateKonsultaXml, type KonsultaPatientData, type KonsultaConsultationData, type KonsultaMedicineData, type KonsultaDiagnosticExamData } from "@/lib/philhealth-yakap/xml-generator";
import { getKonsultaRecommendedService } from "./consultation/konsulta-recommended-services.action";
import { resolvePrincipalMembersByPins } from "@/actions/clinics/konsulta-report.action";

const getClinicCredentials = async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session?.user) throw new Error("Unauthorized");

  const setting = await prisma.clinicSetting.findFirst({
    where: { Clinic: { clinicUid } },
    select: {
      philhealthAccreditationNumber: true,
      philhealthYakapUsername: true,
      philhealthYakapPassword: true,
      philhealthYakapPmccNumber: true,
      konsultaCertificationId: true,
      konsultaCipherKey: true,
    }
  });

  if (!setting) throw new Error("Clinic settings not found");

  const pSoftwareCertificationId = setting.konsultaCertificationId || process.env.PHILHEALTH_KONSULTA_SOFTWARE_CERT_ID || process.env.PHILHEALTH_KONSULTA_CERT_ID || 'KON-DUMMYCERTS-Z15445';
  const cipherKey = setting.konsultaCipherKey || process.env.PHILHEALTH_KONSULTA_CIPHER_KEY || 'PHilheaLthDuMmyZ15445';

  return {
    pHospitalCode: setting.philhealthAccreditationNumber || '',
    pUsername: setting.philhealthYakapUsername || '',
    pUserPassword: setting.philhealthYakapPassword || '',
    pPMCCNo: setting.philhealthYakapPmccNumber || '',
    pSoftwareCertificationId,
    cipherKey
  };
};

export async function getYakapTokenAction(clinicUid: string) {
  try {
    const creds = await getClinicCredentials(clinicUid);
    const client = new YakapApiClient();
    const token = await client.getToken(creds.pUsername, creds.pUserPassword, creds.pSoftwareCertificationId, creds.pHospitalCode);
    return token;
  } catch (err: unknown) {
    console.error("getYakapTokenAction error:", err);
    if (err && typeof err === 'object' && 'body' in err) console.error("Error body:", err.body);
    const msg = err instanceof Error ? err.message : String(err);
    const bodyStr = err && typeof err === 'object' && 'body' in err ? err.body : "";
    throw new Error(`PhilHealth API Error: ${msg} \n\n${bodyStr}`);
  }
}

export async function isMemberDependentRegisteredAction(clinicUid: string, token: string, pPIN: string, pType: string) {
  await getClinicCredentials(clinicUid); // Check auth
  const client = new YakapApiClient();
  const result = await client.isMemberDependentRegistered(pPIN, pType, token);
  console.log({ pPIN, pType, token, result })
  return result;
}

export async function extractRegistrationListLegacyAction(clinicUid: string, token: string, pStartDate: string, pEndDate: string) {
  const creds = await getClinicCredentials(clinicUid);
  const client = new YakapApiClient();
  const result = await client.extractRegistrationList(pStartDate, pEndDate, token, creds.cipherKey);
  return result;
}

export async function isATCValidAction(clinicUid: string, token: string, pPIN: string, pATC: string, pEffectivityDate: string) {
  await getClinicCredentials(clinicUid); // Check auth
  const client = new YakapApiClient();
  const result = await client.isATCValid(pPIN, pATC, pEffectivityDate, token);
  return result;
}

export async function validateReportAction(clinicUid: string, token: string, pReportXml: string, pReportTagging: string) {
  const creds = await getClinicCredentials(clinicUid);
  const client = new YakapApiClient();
  const result = await client.validateReport(pReportXml, pReportTagging, token, creds.cipherKey);
  return result;
}

export async function submitReportAction(clinicUid: string, token: string, pTransmittalId: string, pReportXml: string, pReportTagging: string) {
  const creds = await getClinicCredentials(clinicUid);
  const client = new YakapApiClient();
  const result = await client.submitReport(pTransmittalId, pReportXml, pReportTagging, token, creds.cipherKey);
  return result;
}

export async function verifyKonsultaPinAction(
  clinicUid: string,
  pin: string, // the PIN to verify with Yakap API (Member or Dependent PIN)
  type: string // "MM" or "DD"
) {
  try {
    const tokenResponse = await getYakapTokenAction(clinicUid);
    const token = typeof tokenResponse === 'string'
      ? tokenResponse
      : ((tokenResponse as { result?: string, token?: string })?.result || (tokenResponse as { result?: string, token?: string })?.token);
    if (!token) throw new Error("Failed to acquire Yakap Token");

    // The Yakap API expects "M" or "D", but our schema uses "MM" or "DD".
    const yakapType = type === 'DD' ? 'D' : 'M';
    const result = await isMemberDependentRegisteredAction(clinicUid, token as string, pin, yakapType);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to verify PIN" };
  }
}

export async function enlistKonsultaAction(
  clinicUid: string,
  clinicPatientId: number,
  memberPin?: string,
  dependentPin?: string
) {
  try {
    const setting = await prisma.clinicSetting.findFirst({
      where: { Clinic: { clinicUid } },
      select: { philhealthAccreditationNumber: true, clinicId: true }
    });

    if (!setting || !setting.philhealthAccreditationNumber) {
      throw new Error("PhilHealth Accreditation Number not configured for this clinic.");
    }

    const accreNo = setting.philhealthAccreditationNumber;
    const clinicId = setting.clinicId;

    // Resolve ClinicPatient ID (handles both ClinicPatient.id and Patient.id)
    const cp = await prisma.clinicPatient.findFirst({
      where: {
        OR: [
          { id: clinicPatientId, clinicId },
          { patientId: clinicPatientId, clinicId }
        ],
        isActive: true,
        deletedAt: null
      },
      select: { id: true }
    });

    if (!cp) {
      throw new Error("Patient is not registered in this clinic.");
    }

    if (memberPin?.trim() && dependentPin?.trim() && memberPin.trim() === dependentPin.trim()) {
      throw new Error("Principal Member PIN and Dependent/Patient PIN cannot be the same.");
    }

    const resolvedClinicPatientId = cp.id;
    const year = new Date().getFullYear();

    const existing = await prisma.philHealthKonsultaEnlistment.findUnique({
      where: {
        unique_enlistment_year: { clinicPatientId: resolvedClinicPatientId, year }
      }
    });

    let hciCaseNo = existing?.hciCaseNo || '';
    let enlistmentTransNo = existing?.enlistmentTransNo || '';

    if (!hciCaseNo || !enlistmentTransNo) {
      hciCaseNo = await generatePhilHealthKonsultaTransactionNumber('CASE', accreNo, clinicId);
      enlistmentTransNo = await generatePhilHealthKonsultaTransactionNumber('ENLISTMENT', accreNo, clinicId);
    }

    const enlistment = await prisma.philHealthKonsultaEnlistment.upsert({
      where: {
        unique_enlistment_year: {
          clinicPatientId: resolvedClinicPatientId,
          year,
        }
      },
      update: {
        status: 'ACTIVE',
        memberPin: memberPin || null,
        dependentPin: dependentPin || null,
        hciCaseNo,
        enlistmentTransNo,
      },
      create: {
        clinicPatientId: resolvedClinicPatientId,
        year,
        hciCaseNo,
        enlistmentTransNo,
        memberPin: memberPin || null,
        dependentPin: dependentPin || null,
        status: 'ACTIVE'
      }
    });

    return { success: true, enlistment };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to enlist" };
  }
}



export async function generateKonsultaIdsAction(
  clinicUid: string,
  enlistmentId: number,
  type: 'CASE' | 'PROFILING'
) {
  try {
    const setting = await prisma.clinicSetting.findFirst({
      where: { Clinic: { clinicUid } },
      select: { philhealthAccreditationNumber: true, clinicId: true }
    });

    if (!setting || !setting.philhealthAccreditationNumber) {
      throw new Error("PhilHealth Accreditation Number not configured for this clinic.");
    }

    const accreNo = setting.philhealthAccreditationNumber;
    const clinicId = setting.clinicId;

    const generatedNo = await generatePhilHealthKonsultaTransactionNumber(
      type === 'CASE' ? 'CASE' : 'PROFILING',
      accreNo,
      clinicId
    );

    // Update Enlistment Record
    if (type === 'CASE') {
      const eTransNo = await generatePhilHealthKonsultaTransactionNumber('ENLISTMENT', accreNo, clinicId);
      const updated = await prisma.philHealthKonsultaEnlistment.update({
        where: { id: enlistmentId },
        data: { hciCaseNo: generatedNo, enlistmentTransNo: eTransNo }
      });
      return { success: true, data: updated };
    } else {
      const updated = await prisma.philHealthKonsultaEnlistment.update({
        where: { id: enlistmentId },
        data: { profilingTransNo: generatedNo }
      });
      return { success: true, data: updated };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function getKonsultaEnlistmentAction(clinicPatientId: number) {
  const year = new Date().getFullYear();
  return await prisma.philHealthKonsultaEnlistment.findFirst({
    where: {
      OR: [
        { clinicPatientId },
        { ClinicPatient: { patientId: clinicPatientId } }
      ],
      year
    }
  });
}


export async function generateConsultationSoapTransNoAction(clinicUid: string, ticketId: number) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized");

    const setting = await prisma.clinicSetting.findFirst({
      where: { Clinic: { clinicUid } },
      select: { philhealthAccreditationNumber: true, clinicId: true }
    });

    if (!setting?.philhealthAccreditationNumber || !setting.clinicId) {
      throw new Error("Clinic Accreditation Number or ID not found. Please check Clinic Settings.");
    }

    const ticket = await prisma.consultationTicket.findFirst({
      where: { id: ticketId, Clinic: { clinicUid } }
    });

    if (!ticket) {
      throw new Error("Consultation ticket not found.");
    }

    if (ticket.soapTransNo) {
      throw new Error("This consultation already has a SOAP Transaction Number.");
    }

    const accreNo = setting.philhealthAccreditationNumber;
    const clinicId = setting.clinicId;

    const generatedNo = await generatePhilHealthKonsultaTransactionNumber(
      'SOAP',
      accreNo,
      clinicId
    );

    const updated = await prisma.consultationTicket.update({
      where: { id: ticketId },
      data: { soapTransNo: generatedNo }
    });

    revalidatePath(`/v2/clinic/${clinicUid}/consultations`);
    revalidatePath(`/v2/clinic/${clinicUid}/patients`);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[generateConsultationSoapTransNoAction]", error);
    return { success: false, message: error?.message || "Failed to generate transaction number." };
  }
}

// ============================================================
// BATCH REPORT ACTIONS
// ============================================================



export async function getBatchReportsAction(clinicUid: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) return { status: false, message: "Clinic not found" };

    const batches = await prisma.konsultaBatchReport.findMany({
      where: { clinicId: clinic.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, tagging: true, transmittalNo: true, status: true,
        isPaid: true, createdAt: true, validatedAt: true, submittedAt: true,
        _count: { select: { BatchPatients: true } },
      },
    });

    return { status: true, data: JSON.parse(JSON.stringify(batches)) };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to load batches" };
  }
}

export async function getBatchReportDetailAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({
      where: { id: batchId },
      include: {
        BatchPatients: {
          include: {
            ClinicPatient: {
              include: {
                Patient: {
                  select: { firstName: true, lastName: true, middleName: true, dob: true, gender: true },
                },
                PhilHealthKonsultaEnlistments: {
                  orderBy: { year: "desc" },
                  take: 1,
                },
                ConsultationTickets: {
                  where: { soapTransNo: { not: null }, isActive: true },
                  orderBy: { createdAt: "desc" },
                  select: {
                    id: true, subject: true, soapTransNo: true, createdAt: true,
                    ConsultationTicketAttribute: { select: { status: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) return { status: false, message: "Batch not found" };
    return { status: true, data: JSON.parse(JSON.stringify(batch)) };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to load batch detail" };
  }
}

export async function createBatchReportAction(clinicUid: string, title: string, tagging: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) return { status: false, message: "Clinic not found" };

    const user = await prisma.user.findUnique({ where: { userId: session.user.sub }, select: { id: true } });
    if (!user) return { status: false, message: "User not found" };

    // Get enlisted patients for this clinic
    const clinicPatients = await prisma.clinicPatient.findMany({
      where: {
        clinicId: clinic.id,
        isActive: true,
        PhilHealthKonsultaEnlistments: { some: { status: "ACTIVE" } },
      },
      select: { id: true },
    });

    const batch = await prisma.konsultaBatchReport.create({
      data: {
        clinicId: clinic.id,
        title,
        tagging,
        createdBy: user.id,
        ...(clinicPatients.length > 0 ? {
          BatchPatients: {
            create: clinicPatients.map(cp => ({
              clinicPatientId: cp.id,
              tagging,
              isSelected: true,
            })),
          },
        } : {}),
      },
      select: { id: true, title: true, tagging: true, status: true },
    });

    revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);
    return { status: true, data: { id: batch.id, title: batch.title, tagging: batch.tagging, status: batch.status } };
  } catch (error: any) {
    console.error("[createBatchReportAction]", error);
    return { status: false, message: error?.message || "Failed to create batch" };
  }
}

export async function updateBatchPatientsAction(
  batchId: string,
  updates: { batchPatientId: string; isSelected?: boolean; selectedTicketIds?: number[] }[]
) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    for (const update of updates) {
      const data: Record<string, unknown> = {};
      if (update.isSelected !== undefined) data.isSelected = update.isSelected;
      if (update.selectedTicketIds !== undefined) data.selectedTicketIds = update.selectedTicketIds;

      await prisma.konsultaBatchPatient.update({
        where: { id: update.batchPatientId },
        data,
      });
    }

    return { status: true };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to update patients" };
  }
}

export async function generateBatchXmlAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const credentials = await getClinicCredentials(clinicUid);
    const accreNo = credentials.pHospitalCode;

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) return { status: false, message: "Clinic not found" };

    const batch = await prisma.konsultaBatchReport.findUnique({
      where: { id: batchId },
      include: {
        BatchPatients: {
          where: { isSelected: true },
          include: {
            ClinicPatient: {
              include: {
                Patient: {
                  select: {
                    id: true,
                    firstName: true, lastName: true, middleName: true, suffix: true,
                    dob: true, gender: true, mobile: true, telephone: true, bloodType: true,
                    PhilHealthRecords: { take: 1 },
                    MedicalHistories: {
                      include: { Condition: true },
                    },
                    FamilyMedicalHistories: {
                      include: { Condition: true },
                    },
                    SurgicalHistories: true,
                    PersonalHistory: true,
                    ObGyneHistory: true,
                    UserVaccinations: { include: { Vaccine: { include: { PhilHealthData: true } } } },
                    VitalSigns: {
                      where: { isActive: true, deletedAt: null },
                      orderBy: { createdAt: "desc" },
                      take: 1,
                      select: {
                        bpSystolic: true, bpDiastolic: true, pulseRate: true, respRate: true,
                        temp: true, height: true, weight: true, bmi: true, zScore: true,
                        visualAcuityLeft: true, visualAcuityRight: true,
                        length: true, headCircumference: true, skinfoldThickness: true,
                        waistCircumference: true, hipCircumference: true,
                        limbCircumference: true, midUpperArmCircumference: true,
                      },
                    },
                    PhysicalExaminations: {
                      where: { deletedAt: null },
                      orderBy: { createdAt: "asc" },
                    },
                    NcdQuestionnaire: true,
                  },
                },
                PhilHealthKonsultaEnlistments: {
                  where: { status: "ACTIVE" },
                  orderBy: { year: "desc" },
                  take: 1,
                },
                ConsultationTickets: {
                  where: { soapTransNo: { not: null }, isActive: true },
                  select: {
                    id: true, subject: true, soapTransNo: true, caseNumber: true, createdAt: true,
                    isPhilHealthKonsulta: true,
                    konsultaAtcCode: true, konsultaIsWalkedIn: true, konsultaCoPay: true,
                    konsultaRecommendedDiagnosticOptions: true,
                    DiagnosticRequests: {
                      where: { isArchived: false },
                      select: { diagnosticProcedures: true },
                    },
                    ConsultationNotes: {
                      select: { section: true, content: true, structuredData: true },
                    },
                    ConsultationDiagnoses: {
                      select: { icd10Code: true },
                    },
                    Prescriptions: {
                      where: { isActive: true },
                      select: {
                        Medicines: {
                          where: { isActive: true },
                          select: {
                            id: true, name: true, genericName: true, brandName: true,
                            dosage: true, frequency: true, unit: true, qty: true,
                            PhilHealthData: true,
                          },
                        },
                      },
                    },
                    ConsultationManagements: {
                      include: { ManagementCode: true },
                    },
                    PhysicalExaminations: {
                      where: { deletedAt: null },
                      orderBy: { createdAt: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) return { status: false, message: "Batch not found" };
    if (batch.status === "SUBMITTED") return { status: false, message: "Cannot modify a submitted batch" };

    // Generate transmittal number if not set
    let transmittalNo = batch.transmittalNo;
    if (!transmittalNo) {
      transmittalNo = await generatePhilHealthKonsultaTransactionNumber(
        "TRANSMITTAL", accreNo, clinic.id
      );
    }

    // Helper: map VitalSign record to XML vitals format
    const mapVitals = (vs: {
      bpSystolic?: number | null; bpDiastolic?: number | null;
      pulseRate?: number | null; respRate?: number | null; temp?: number | null;
      height?: number | null; weight?: number | null; bmi?: number | null;
      visualAcuityLeft?: string | null; visualAcuityRight?: string | null;
      length?: number | null; headCircumference?: number | null;
      skinfoldThickness?: number | null; waistCircumference?: number | null;
      hipCircumference?: number | null; limbCircumference?: number | null;
      midUpperArmCircumference?: number | null; zScore?: number | null;
    } | null | undefined) => ({
      systolic: vs?.bpSystolic?.toString() ?? "",
      diastolic: vs?.bpDiastolic?.toString() ?? "",
      hr: vs?.pulseRate?.toString() ?? "",
      rr: vs?.respRate?.toString() ?? "",
      temp: vs?.temp?.toString() ?? "",
      height: vs?.height?.toString() ?? "",
      weight: vs?.weight?.toString() ?? "",
      bmi: vs?.bmi?.toString() ?? "",
      zScore: vs?.zScore?.toString() ?? "",
      leftVision: vs?.visualAcuityLeft ?? "",
      rightVision: vs?.visualAcuityRight ?? "",
      length: vs?.length?.toString() ?? "",
      headCirc: vs?.headCircumference?.toString() ?? "",
      skinfoldThickness: vs?.skinfoldThickness?.toString() ?? "",
      waist: vs?.waistCircumference?.toString() ?? "",
      hip: vs?.hipCircumference?.toString() ?? "",
      limbs: vs?.limbCircumference?.toString() ?? "",
      midUpperArmCirc: vs?.midUpperArmCircumference?.toString() ?? "",
    });

    const mapPhysicalExam = (pe: {
      generalSurveyId?: string | null; generalSurveyRemarks?: string | null;
      heentId?: string | null; heentRemarks?: string | null;
      chestId?: string | null; chestRemarks?: string | null;
      heartId?: string | null; heartRemarks?: string | null;
      abdomenId?: string | null; abdomenRemarks?: string | null;
      guId?: string | null; guRemarks?: string | null;
      skinId?: string | null; skinRemarks?: string | null;
      neuroId?: string | null; neuroRemarks?: string | null;
      rectalId?: string | null; rectalRemarks?: string | null;
    } | null | undefined) => pe ? {
      generalSurveyId: pe.generalSurveyId ?? "",
      generalSurveyRemarks: pe.generalSurveyRemarks ?? "",
      heentId: pe.heentId ?? "",
      heentRemarks: pe.heentRemarks ?? "",
      chestId: pe.chestId ?? "",
      chestRemarks: pe.chestRemarks ?? "",
      heartId: pe.heartId ?? "",
      heartRemarks: pe.heartRemarks ?? "",
      abdomenId: pe.abdomenId ?? "",
      abdomenRemarks: pe.abdomenRemarks ?? "",
      guId: pe.guId ?? "",
      guRemarks: pe.guRemarks ?? "",
      skinId: pe.skinId ?? "",
      skinRemarks: pe.skinRemarks ?? "",
      neuroId: pe.neuroId ?? "",
      neuroRemarks: pe.neuroRemarks ?? "",
      rectalId: pe.rectalId ?? "",
      rectalRemarks: pe.rectalRemarks ?? "",
    } : undefined;

    // Build patient data for XML generator (async for DB lookups)
    const patients: KonsultaPatientData[] = await Promise.all(batch.BatchPatients.map(async (bp) => {
      const patient = bp.ClinicPatient.Patient;
      const enlistment = bp.ClinicPatient.PhilHealthKonsultaEnlistments[0];
      const phRecord = patient.PhilHealthRecords?.[0];
      const latestVitals = patient.VitalSigns?.[0] ?? null;
      if (latestVitals) {
        const decimals: (keyof typeof latestVitals)[] = ['length', 'headCircumference', 'skinfoldThickness', 'waistCircumference', 'hipCircumference', 'limbCircumference', 'midUpperArmCircumference'];
        decimals.forEach(k => {
          if (latestVitals[k]) {
            (latestVitals as any)[k] = (latestVitals[k] as any).toNumber();
          }
        });
      }

      const memberPin = phRecord?.principalMemberPin || phRecord?.pin || "";
      const patientPin = phRecord?.pin || "";
      const patientType = (phRecord?.memberType as "MM" | "DD") || "MM";

      // Compute age
      const dob = patient.dob ? new Date(patient.dob) : new Date();
      const now = new Date();
      const ageYears = now.getFullYear() - dob.getFullYear();
      const ageMonths = now.getMonth() - dob.getMonth();
      const ageDays = now.getDate() - dob.getDate();
      const adjustedMonths = ageDays < 0 ? ageMonths - 1 : ageMonths;
      const adjustedYears = adjustedMonths < 0 ? ageYears - 1 : ageYears;
      const finalMonths = adjustedMonths < 0 ? adjustedMonths + 12 : adjustedMonths;
      const finalDays = ageDays < 0 ? 30 + ageDays : ageDays;
      const ageStr = `${adjustedYears} YR(S), ${finalMonths} MO(S), ${finalDays} DAY(S)`;

      const formatDate = (d: Date | null) => d ? d.toISOString().split("T")[0] : "";
      const today = formatDate(new Date());

      // Profile ATC/walk-in: from enlistment or defaults
      const profileAtc = enlistment?.atcCode ?? "WALKEDIN";
      const profileIsWalkedIn = enlistment?.isWalkedIn ?? true;

      // Fetch all diagnostic procedures to map to philhealth IDs
      const allDiagProcs = await prisma.diagnosticProcedure.findMany({
        where: { isActive: true, philhealthDiagnosticId: { not: null } },
        select: { id: true, philhealthDiagnosticId: true },
      });
      const diagnosticProcedureMap = Object.fromEntries(
        allDiagProcs.map(dp => [dp.id, dp.philhealthDiagnosticId])
      );

      // Build consultations for Tagging 2
      let consultations: KonsultaConsultationData[] | undefined;
      if (batch.tagging === "2" && bp.selectedTicketIds.length > 0) {
        consultations = await Promise.all(bp.ClinicPatient.ConsultationTickets
          .filter(t => bp.selectedTicketIds.includes(t.id))
          .map(async t => {
            // Fetch recommended diagnostic services for the patient
            const ageTotalMonths = adjustedYears * 12 + finalMonths;
            const recommended = await getKonsultaRecommendedService(ageTotalMonths, patient.gender);
            const allRecommendedDiagnosticIds = recommended?.philhealthDiagnosticIds || [];

            // Subjective structured data from notes
            const subjectiveNote = t.ConsultationNotes?.find(n =>
              n.section.toLowerCase().includes("subjective")
            );
            const sd = (subjectiveNote?.structuredData && typeof subjectiveNote.structuredData === 'object' && !Array.isArray(subjectiveNote.structuredData))
              ? subjectiveNote.structuredData as Record<string, string>
              : {};

            // ICD codes from diagnoses
            const icdCodes = (t.ConsultationDiagnoses ?? [])
              .map(d => d.icd10Code)
              .filter((c): c is string => !!c);

            // Medicines from prescriptions
            const medicines: KonsultaMedicineData[] = [];
            for (const rx of t.Prescriptions ?? []) {
              for (const med of rx.Medicines ?? []) {
                const ph = med.PhilHealthData;

                const isCustom = ph?.drugCode?.startsWith("NOMED") || false;

                medicines.push({
                  hciCaseNo: enlistment?.hciCaseNo || "",
                  hciTransNo: t.soapTransNo || "",
                  category: ph?.category || "",
                  drugCode: ph?.drugCode || "NOMED00000000000000000000000",
                  genericCode: ph?.genericCode || "",
                  saltCode: ph?.saltCode || "",
                  strengthCode: ph?.strengthCode || "",
                  formCode: ph?.formCode || "",
                  unitCode: ph?.unitCode || "",
                  packageCode: ph?.packageCode || "",
                  otherMedicine: isCustom ? (ph?.otherMedicine || med.name || "") : "",
                  othMedDrugGrouping: ph?.othMedDrugGrouping || "",
                  route: ph?.route || "",
                  quantity: med.qty?.toString() || "0",
                  actualUnitPrice: ph?.actualUnitPrice?.toString() || "0",
                  totalAmtPrice: ph?.totalAmtPrice?.toString() || "0",
                  instructionQuantity: ph?.instructionQuantity || "1",
                  instructionStrength: ph?.instructionStrength || med.dosage || "",
                  instructionFrequency: ph?.instructionFrequency || med.frequency || "",
                  prescribingPhysician: "",
                  isDispensed: "N",
                  dateDispensed: "",
                  dispensingPersonnel: "",
                  isApplicable: "Y",
                  dateAdded: formatDate(t.createdAt),
                });
              }
            }

            return {
              hciCaseNo: enlistment?.hciCaseNo || "",
              hciTransNo: t.soapTransNo || "",
              soapDate: formatDate(t.createdAt),
              atc: t.konsultaAtcCode || profileAtc,
              isWalkedIn: (t.konsultaIsWalkedIn ?? profileIsWalkedIn) ? "Y" as const : "N" as const,
              coPay: t.konsultaCoPay?.toString() || "0",
              transDate: today,
              subjective: {
                illnessHistory: sd.illnessHistory || t.subject || "",
                signsSymptoms: sd.signsSymptoms || "",
                otherComplaint: sd.otherComplaint || "",
                painSite: sd.painSite || "",
              },
              vitals: mapVitals(latestVitals as any),
              physicalExam: mapPhysicalExam(t.PhysicalExaminations?.[0]),
              icdCodes,
              managements: (t.ConsultationManagements ?? []).map((m) => ({
                managementId: m.ManagementCode.code,
                othRemarks: m.remarks || "",
              })),
              medicines,
              konsultaRecommendedDiagnosticOptions: (t.konsultaRecommendedDiagnosticOptions as any) || [],
              diagnosticRequests: (t.DiagnosticRequests ?? []).flatMap((dr) => {
                const procs = dr.diagnosticProcedures as any;
                if (!Array.isArray(procs)) return [];
                return procs.map(p => ({
                  philhealthDiagnosticId: diagnosticProcedureMap[p.diagnosticProcedureId] || null,
                }));
              }).filter(d => d.philhealthDiagnosticId !== null),
              allRecommendedDiagnosticIds,
            };
          }));
      }

      // Fetch diagnostic results — query by selected consultation ticket IDs (most reliable)
      // for Tagging 1 fall back to clinicPatientId
      const ticketIds = bp.selectedTicketIds ?? [];
      const diagRecords = await prisma.konsultaDiagnosticResult.findMany({
        where: ticketIds.length > 0
          ? {
            OR: [
              { consultationTicketId: { in: ticketIds } },
              { consultationTicketId: null, clinicPatientId: bp.ClinicPatient.id }
            ]
          }
          : { clinicPatientId: bp.ClinicPatient.id },
        orderBy: { createdAt: "asc" },
      });
      const diagnosticResults = diagRecords.length > 0
        ? diagRecords.map(dr => ({
          hciCaseNo: dr.hciCaseNo || enlistment?.hciCaseNo || "",
          hciTransNo: dr.hciTransNo || enlistment?.profilingTransNo || "",
          patientPin: patientPin,
          patientType: patientType,
          memPin: memberPin,
          effYear: String(enlistment?.year || new Date().getFullYear()),
          resultType: dr.resultType,
          resultData: (dr.resultData && typeof dr.resultData === 'object' && !Array.isArray(dr.resultData))
            ? dr.resultData as Record<string, string>
            : {},
        }))
        : undefined;

      let memberFirstName = (patient.firstName || "").toUpperCase();
      let memberMiddleName = (patient.middleName || "").toUpperCase();
      let memberLastName = (patient.lastName || "").toUpperCase();
      let memberExtName = (patient.suffix || "").toUpperCase();
      let memberDobStr = formatDate(patient.dob);

      if (patientType === "DD") {
        const pmMap = memberPin ? await resolvePrincipalMembersByPins([memberPin]) : new Map();
        const pm = memberPin ? pmMap.get(memberPin.trim()) : null;

        const isEnlistmentSameAsPatient = enlistment && (
          enlistment.memberFname?.trim().toUpperCase() === patient.firstName?.trim().toUpperCase() &&
          enlistment.memberLname?.trim().toUpperCase() === patient.lastName?.trim().toUpperCase()
        );

        if (pm) {
          memberFirstName = pm.firstName.toUpperCase();
          memberMiddleName = pm.middleName.toUpperCase();
          memberLastName = pm.lastName.toUpperCase();
          memberExtName = pm.extensionName.toUpperCase();
          memberDobStr = pm.dob;
        } else if (enlistment && enlistment.memberFname && !isEnlistmentSameAsPatient) {
          memberFirstName = enlistment.memberFname.toUpperCase();
          memberMiddleName = (enlistment.memberMname || "").toUpperCase();
          memberLastName = (enlistment.memberLname || "").toUpperCase();
          memberExtName = (enlistment.memberExtname || "").toUpperCase();
          memberDobStr = enlistment.memberDob ? formatDate(enlistment.memberDob) : "";
        } else {
          memberFirstName = "";
          memberMiddleName = "";
          memberLastName = "";
          memberExtName = "";
          memberDobStr = "";
        }
      }

      return {
        enlistment: {
          hciCaseNo: enlistment?.hciCaseNo || "",
          hciTransNo: enlistment?.enlistmentTransNo || "",
          effYear: String(enlistment?.year || new Date().getFullYear()),
          enlistDate: today,
          packageType: "K" as const,
          withConsent: "Y" as const,
          transDate: today,
          createdBy: session.user?.email || "CLINICEZ",
        },
        member: {
          pin: memberPin,
          firstName: memberFirstName,
          middleName: memberMiddleName,
          lastName: memberLastName,
          extName: memberExtName,
          dob: memberDobStr,
        },
        patient: {
          pin: patientPin,
          firstName: (patient.firstName || "").toUpperCase(),
          middleName: (patient.middleName || "").toUpperCase(),
          lastName: (patient.lastName || "").toUpperCase(),
          extName: (patient.suffix || "").toUpperCase(),
          sex: (patient.gender === "FEMALE" ? "F" : "M") as "M" | "F",
          dob: formatDate(patient.dob),
          type: patientType,
          mobileNo: patient.mobile || "00000000000",
          landlineNo: patient.telephone || "",
          age: ageStr,
        },
        profile: {
          hciTransNo: enlistment?.hciCaseNo?.replace(/^T-/, 'P-') || "",
          profDate: enlistment?.createdAt ? formatDate(enlistment.createdAt) : today,
          atc: profileAtc,
          isWalkedIn: profileIsWalkedIn ? "Y" as const : "N" as const,
          transDate: today,
          vitals: mapVitals(latestVitals as any),
          physicalExaminations: patient.PhysicalExaminations.map(pe => mapPhysicalExam(pe)).filter((x): x is NonNullable<typeof x> => !!x),
          bloodType: patient.bloodType === 'A_POSITIVE' ? 'A+' :
            patient.bloodType === 'A_NEGATIVE' ? 'A-' :
              patient.bloodType === 'B_POSITIVE' ? 'B+' :
                patient.bloodType === 'B_NEGATIVE' ? 'B-' :
                  patient.bloodType === 'AB_POSITIVE' ? 'AB+' :
                    patient.bloodType === 'AB_NEGATIVE' ? 'AB-' :
                      patient.bloodType === 'O_POSITIVE' ? 'O+' :
                        patient.bloodType === 'O_NEGATIVE' ? 'O-' : '',
          medicalHistories: patient.MedicalHistories.map(mh => {
            const code = mh.Condition.code;
            if (code) {
              return {
                code,
                isRelevant: 'Y' as const,
                mhsOthers: mh.details || '',
              };
            }
            return {
              code: '998',
              isRelevant: 'Y' as const,
              mhsCode: '998',
              mhsOthers: mh.details || mh.Condition.name,
            };
          }),
          familyHistories: patient.FamilyMedicalHistories.map(fh => {
            const code = fh.Condition.code;
            if (code) {
              return {
                code,
                specificDesc: fh.details || ''
              };
            }
            return {
              code: '998',
              specificDesc: fh.details || fh.Condition.name,
            };
          }),
          surgicalHistories: patient.SurgicalHistories.map(sh => ({
            desc: sh.operationName,
            date: sh.operationDate ? formatDate(sh.operationDate) : '',
          })),
          socialHistory: patient.PersonalHistory ? {
            isSmoker: patient.PersonalHistory.smokingStatus === 'CURRENT' ? 'Y' : (patient.PersonalHistory.smokingStatus === 'NEVER' || patient.PersonalHistory.smokingStatus === 'FORMER' ? 'N' : ''),
            noCigpk: patient.PersonalHistory.numberOfPacksPerYear ? String(patient.PersonalHistory.numberOfPacksPerYear) : '',
            isAdrinker: (patient.PersonalHistory.alcoholStatus === 'OCCASIONAL' || patient.PersonalHistory.alcoholStatus === 'REGULAR' || patient.PersonalHistory.alcoholStatus === 'HEAVY') ? 'Y' : (patient.PersonalHistory.alcoholStatus === 'NEVER' ? 'N' : ''),
            noBottles: patient.PersonalHistory.numberOfBottlesPerDay ? String(patient.PersonalHistory.numberOfBottlesPerDay) : '',
            illDrugUser: patient.PersonalHistory.illicitDrugUse === 'CURRENT' ? 'Y' : (patient.PersonalHistory.illicitDrugUse === 'NEVER' || patient.PersonalHistory.illicitDrugUse === 'FORMER' ? 'N' : ''),
            isSexuallyActive: patient.PersonalHistory.sexuallyActive === 'YES' ? 'Y' : (patient.PersonalHistory.sexuallyActive === 'NO' || patient.PersonalHistory.sexuallyActive === 'INACTIVE' ? 'N' : ''),
          } : undefined,
          obGyneHistory: patient.ObGyneHistory ? {
            menarche: patient.ObGyneHistory.menarche?.toString() || '',
            lastMensPeriod: patient.ObGyneHistory.lastMenstrualPeriod ? formatDate(patient.ObGyneHistory.lastMenstrualPeriod) : '',
            periodDuration: patient.ObGyneHistory.menstrualPeriodDuration?.toString() || '',
            mensInterval: patient.ObGyneHistory.menstrualCycleInterval?.toString() || '',
            padsPerDay: patient.ObGyneHistory.numberOfPadsPerDay?.toString() || '',
            onsetSexIntercourse: patient.ObGyneHistory.ageAtFirstSexualIntercourse?.toString() || '',
            birthControl: patient.ObGyneHistory.isFamilyPlanning ? (patient.ObGyneHistory.birthControlMethod || '') : '',
            isMenopause: patient.ObGyneHistory.menopauseStatus === 'YES' ? 'Y' : (patient.ObGyneHistory.menopauseStatus === 'NO' ? 'N' : ''),
            menopauseAge: patient.ObGyneHistory.menopauseAge?.toString() || '',
            gravida: patient.ObGyneHistory.gravidity?.toString() || '',
            para: patient.ObGyneHistory.parity?.toString() || '',
            fullTerms: patient.ObGyneHistory.fullTerm?.toString() || '',
            premature: patient.ObGyneHistory.premature?.toString() || '',
            abortion: patient.ObGyneHistory.abortion?.toString() || '',
            livingChildren: patient.ObGyneHistory.livingChildren?.toString() || '',
            typeLasDelivery: patient.ObGyneHistory.typeOfDelivery === 'VAGINAL' ? 'N' :
              patient.ObGyneHistory.typeOfDelivery === 'CESAREAN' ? 'O' :
                patient.ObGyneHistory.typeOfDelivery === 'MIXED' ? 'B' : 'X',
            isPreEclampsia: patient.ObGyneHistory.hasPreEclampsia ? 'Y' : 'N',
            wFamPlan: patient.ObGyneHistory.isFamilyPlanning ? 'Y' : 'N',
          } : undefined,
          immunizations: patient.UserVaccinations.map(uv => {
            const vName = (uv.Vaccine.name || '').toUpperCase().trim();
            const phData = uv.Vaccine.PhilHealthData;

            let childCode = phData?.childImmcode || '';
            let youngwCode = phData?.youngwImmcode || '';
            let pregwCode = phData?.pregwImmcode || '';
            let elderlyCode = phData?.elderlyImmcode || '';
            let otherImm = phData?.otherImm || '';

            // If the vaccine has NO mapping at all, fallback to "999" and put name in otherImm
            if (!phData) {
              childCode = '999';
              youngwCode = '999';
              pregwCode = '999';
              elderlyCode = '999';
              otherImm = vName;
            }

            return {
              childImmcode: childCode || '999',
              youngwImmcode: youngwCode || '999',
              pregwImmcode: pregwCode || '999',
              elderlyImmcode: elderlyCode || '999',
              otherImm: otherImm,
              reportStatus: 'U', // U = Updated
              deficiencyRemarks: uv.notes || '',
            };
          }),
        },
        consultations,
        diagnosticResults,
      };
    }));

    const pmccNo = credentials.pPMCCNo || "";

    const xml = generateKonsultaXml({
      credentials: {
        pUsername: "",
        pPassword: "",
        pHciAccreNo: accreNo,
        pPMCCNo: pmccNo,
        pCertificationId: credentials.pSoftwareCertificationId || "",
        pHciTransmittalNumber: transmittalNo,
      },
      tagging: batch.tagging as "1" | "2",
      patients,
    });

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        xmlPayload: xml,
        transmittalNo,
        status: "DRAFT",
        validationResult: null,
        validatedAt: null,
      },
    });

    revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);
    return { status: true, data: { transmittalNo } };
  } catch (err: unknown) {
    console.error("Yakap generateBatchXmlAction Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function downloadEncryptedBatchXmlAction(clinicUid: string, batchId: string) {
  try {
    const creds = await getClinicCredentials(clinicUid);
    const batch = await prisma.konsultaBatchReport.findFirst({
      where: { id: batchId, Clinic: { clinicUid } }
    });
    if (!batch || !batch.xmlPayload) throw new Error("Batch XML not found");

    return encryptReport(batch.xmlPayload, creds.cipherKey);
  } catch (err: unknown) {
    console.error("Yakap downloadEncryptedBatchXmlAction Error:", err);
    throw new Error(err instanceof Error ? err.message : "Failed to encrypt XML");
  }
}

export async function validateBatchReportAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({ where: { id: batchId } });
    if (!batch || !batch.xmlPayload) return { status: false, message: "Batch not found or no XML" };
    if (batch.status === "SUBMITTED") return { status: false, message: "Cannot validate a submitted batch" };

    const credentials = await getClinicCredentials(clinicUid);
    if (!credentials.pUsername || !credentials.pUserPassword) {
      return { status: false, message: "PhilHealth Yakap Username and Password must be configured in Clinic Settings -> PhilHealth & Insurance." };
    }
    if (!credentials.pHospitalCode) {
      return { status: false, message: "PhilHealth Accreditation Number is missing in Clinic Settings." };
    }
    if (!credentials.pSoftwareCertificationId) {
      return { status: false, message: "PHILHEALTH_KONSULTA_SOFTWARE_CERT_ID environment variable is missing." };
    }

    const apiClient = new YakapApiClient();

    const tokenResult = await apiClient.getToken(
      credentials.pUsername, credentials.pUserPassword,
      credentials.pSoftwareCertificationId, credentials.pHospitalCode
    );

    const token = typeof tokenResult === "string" ? tokenResult : (tokenResult?.result || tokenResult?.token || "");
    if (!token) {
      const apiMsg = typeof tokenResult === "object" && tokenResult ? (tokenResult.message || tokenResult.error || JSON.stringify(tokenResult)) : "Invalid API token returned";
      return { status: false, message: `Failed to acquire PhilHealth API token: ${apiMsg}` };
    }

    const validationResult = await apiClient.validateReport(
      batch.xmlPayload, batch.tagging, token, credentials.cipherKey
    );

    // Check if the PhilHealth API returned success
    const apiSuccess = validationResult?.success === true || validationResult?.success === "true";

    // Decrypt errors if validation failed and encrypted errors are present
    let enrichedResult = { ...validationResult };
    if (!apiSuccess && validationResult?.encryptedxmlerrors) {
      try {
        const encryptedErrors = validationResult.encryptedxmlerrors;
        const encryptedJson = typeof encryptedErrors === "string" ? encryptedErrors : JSON.stringify(encryptedErrors);
        const decryptedErrorsStr = decryptReport(encryptedJson, credentials.cipherKey);
        enrichedResult.decryptedErrors = decryptedErrorsStr;
      } catch (decryptErr) {
        console.error("[validateBatchReportAction] Failed to decrypt errors:", decryptErr);
      }
    }
    // Also decrypt the xml if present
    if (validationResult?.encryptedxml) {
      try {
        const encryptedXml = validationResult.encryptedxml;
        const encryptedXmlJson = typeof encryptedXml === "string" ? encryptedXml : JSON.stringify(encryptedXml);
        const decryptedXml = decryptReport(encryptedXmlJson, credentials.cipherKey);
        enrichedResult.decryptedXml = decryptedXml;
      } catch (decryptErr) {
        console.error("[validateBatchReportAction] Failed to decrypt xml:", decryptErr);
      }
    }

    const validationResultStr = JSON.stringify(enrichedResult, null, 2);

    const updateData: {
      status: string;
      validationResult: string;
      validatedAt: Date | null;
      xmlPayload?: string;
    } = {
      status: apiSuccess ? "VALIDATED" : "DRAFT",
      validationResult: validationResultStr,
      validatedAt: apiSuccess ? new Date() : null,
    };

    if (enrichedResult.decryptedResult) {
      updateData.xmlPayload = enrichedResult.decryptedResult;
    } else if (enrichedResult.decryptedXml) {
      updateData.xmlPayload = enrichedResult.decryptedXml;
    }

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: updateData,
    });

    revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);

    if (apiSuccess) {
      return { status: true, data: enrichedResult };
    } else {
      return {
        status: false,
        message: validationResult?.message || "Validation failed — see result details",
        data: enrichedResult,
      };
    }
  } catch (error: any) {
    console.error("[validateBatchReportAction]", error);
    return { status: false, message: error?.message || "Validation failed" };
  }
}

export async function submitBatchReportAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({ where: { id: batchId } });
    if (!batch || !batch.xmlPayload || !batch.transmittalNo) {
      return { status: false, message: "Batch not ready for submission" };
    }
    if (batch.status !== "VALIDATED") return { status: false, message: "Batch must be validated first" };

    const credentials = await getClinicCredentials(clinicUid);
    if (!credentials.pUsername || !credentials.pUserPassword) {
      return { status: false, message: "PhilHealth Yakap Username and Password must be configured in Clinic Settings." };
    }

    const apiClient = new YakapApiClient();

    const tokenResult = await apiClient.getToken(
      credentials.pUsername, credentials.pUserPassword,
      credentials.pSoftwareCertificationId, credentials.pHospitalCode
    );

    const token = typeof tokenResult === "string" ? tokenResult : (tokenResult?.result || tokenResult?.token || "");
    if (!token) {
      const apiMsg = typeof tokenResult === "object" && tokenResult ? (tokenResult.message || tokenResult.error || JSON.stringify(tokenResult)) : "Invalid API token returned";
      return { status: false, message: `Failed to acquire PhilHealth API token: ${apiMsg}` };
    }

    const submissionResult = await apiClient.submitReport(
      batch.transmittalNo, batch.xmlPayload, batch.tagging, token, credentials.cipherKey
    );

    const resStr = JSON.stringify(submissionResult || {});
    const isAlreadyUploaded = resStr.includes("FILE ALREADY UPLOADED") || resStr.includes("ALREADY UPLOADED");
    const isSuccess = submissionResult?.success === true || submissionResult?.success === "true" || submissionResult?.success === "True" || isAlreadyUploaded;

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        status: isSuccess ? "SUBMITTED" : "VALIDATED",
        submissionResult: JSON.stringify(submissionResult, null, 2),
        submittedAt: isSuccess ? (batch.submittedAt || new Date()) : null,
      },
    });

    revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);
    return { status: true, data: submissionResult };
  } catch (error: any) {
    console.error("[submitBatchReportAction]", error);
    return { status: false, message: error?.message || "Submission failed" };
  }
}

export async function regenerateBatchXmlAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({ where: { id: batchId } });
    if (!batch) return { status: false, message: "Batch not found" };

    // Clear validation and transmittalNo so a fresh transmittal number is generated
    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        status: "DRAFT",
        transmittalNo: null,
        xmlPayload: null,
        validationResult: null,
        validatedAt: null,
        submissionResult: null,
        submittedAt: null,
      },
    });

    // Now regenerate
    return await generateBatchXmlAction(clinicUid, batchId);
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to regenerate XML" };
  }
}

export async function unsubmitBatchReportAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({ where: { id: batchId } });
    if (!batch) return { status: false, message: "Batch not found" };

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        status: "DRAFT",
        transmittalNo: null,
        xmlPayload: null,
        validationResult: null,
        validatedAt: null,
        submissionResult: null,
        submittedAt: null,
      },
    });

    revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);
    return { status: true, message: "Batch status reset to DRAFT for testing" };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to unsubmit batch" };
  }
}

export async function deleteBatchReportAction(clinicUid: string, batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({ where: { id: batchId } });
    if (!batch) return { status: false, message: "Batch not found" };
    if (batch.status === "SUBMITTED") return { status: false, message: "Cannot delete a submitted batch" };

    await prisma.konsultaBatchReport.delete({ where: { id: batchId } });

    revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);
    return { status: true };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to delete batch" };
  }
}

export async function getSubmissionHistoryAction(clinicUid: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) return { status: false, message: "Clinic not found" };

    const submissions = await prisma.konsultaBatchReport.findMany({
      where: { clinicId: clinic.id, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true, title: true, tagging: true, transmittalNo: true, status: true,
        isPaid: true, submittedAt: true, submissionResult: true,
        _count: { select: { BatchPatients: true } },
      },
    });

    return { status: true, data: submissions };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to load history" };
  }
}

export async function toggleBatchPaidAction(batchId: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const batch = await prisma.konsultaBatchReport.findUnique({ where: { id: batchId }, select: { isPaid: true } });
    if (!batch) return { status: false, message: "Batch not found" };

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: { isPaid: !batch.isPaid },
    });

    return { status: true };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to update payment status" };
  }
}

export async function verifyAtcAction(clinicUid: string, pin: string, atc: string, effectivityDate: string) {
  try {
    const credentials = await getClinicCredentials(clinicUid);
    const apiClient = new YakapApiClient();

    const tokenResult = await apiClient.getToken(
      credentials.pUsername, credentials.pUserPassword,
      credentials.pSoftwareCertificationId, credentials.pHospitalCode
    );

    const token = tokenResult?.result || tokenResult?.token || "";
    if (!token) return { status: false, message: "Failed to get API token" };

    // Convert date from YYYY-MM-DD to mm/dd/yyyy for the API
    const [year, month, day] = effectivityDate.split("-");
    const formattedDate = `${month}/${day}/${year}`;

    const result = await apiClient.isATCValid(pin, atc, formattedDate, token);
    const isValid = typeof result === "string" ? result.toUpperCase() === "YES" : result?.result?.toUpperCase() === "YES";

    return { status: true, data: { valid: isValid, message: isValid ? "Authorization Transaction Code is valid and active" : "Authorization Transaction Code is not valid or inactive" } };
  } catch (error: any) {
    return { status: false, message: error?.message || "Authorization Transaction Code verification failed" };
  }
}

export async function extractRegistrationListAction(clinicUid: string, startDate: string, endDate: string) {
  try {
    const credentials = await getClinicCredentials(clinicUid);
    const apiClient = new YakapApiClient();

    const tokenResult = await apiClient.getToken(
      credentials.pUsername, credentials.pUserPassword,
      credentials.pSoftwareCertificationId, credentials.pHospitalCode
    );

    const token = tokenResult?.result || tokenResult?.token || "";
    if (!token) return { status: false, message: "Failed to get API token" };

    // Convert dates from YYYY-MM-DD to mm/dd/yyyy for the API
    const formatApiDate = (d: string) => {
      const [y, m, day] = d.split("-");
      return `${m}/${day}/${y}`;
    };

    const result = await apiClient.extractRegistrationList(
      formatApiDate(startDate), formatApiDate(endDate), token, credentials.cipherKey
    );

    const rawStr = typeof result === "string" ? result : JSON.stringify(result, null, 2);

    // Try to parse as XML (ASSIGNMENTS > ASSIGNMENT elements per KonsultaMasterlist DTD)
    interface RegistrationEntry {
      pAssignedPin: string;
      pAssignedLastName: string;
      pAssignedFirstName: string;
      pAssignedMiddleName: string;
      pAssignedExtName: string;
      pAssignedDateOfBirth: string;
      pAssignedSex: string;
      pAssignedType: string;
      pPrimaryPIN: string;
      pPrimaryLastName: string;
      pPrimaryFirstName: string;
      pPrimaryMiddleName: string;
      pPrimaryExtName: string;
      pPrimaryDateOfBirth: string;
      pPrimarySex: string;
      pMobileNumber: string;
      pLandlineNumber: string;
      pMemberNewCat: string;
      pMemberNewCatDesc: string;
      pPackageType: string;
      pAssignedDate: string;
      pAssignedStatus: string;
      pEffYear: string;
    }

    const entries: RegistrationEntry[] = [];

    try {
      const { convert } = await import("xmlbuilder2");
      const parsed = convert(rawStr, { format: "object" }) as Record<string, unknown>;
      const assignments = parsed?.ASSIGNMENTS as Record<string, unknown> | undefined;

      if (assignments) {
        const assignmentList = assignments.ASSIGNMENT;
        const items = Array.isArray(assignmentList) ? assignmentList : assignmentList ? [assignmentList] : [];

        for (const item of items) {
          if (typeof item === "object" && item !== null) {
            const attrs: Record<string, string> = {};
            for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
              // xmlbuilder2 uses @attrName for attributes
              const attrName = key.startsWith("@") ? key.slice(1) : key;
              attrs[attrName] = String(value ?? "");
            }
            entries.push(attrs as unknown as RegistrationEntry);
          }
        }
      }
    } catch {
      // If XML parsing fails, try JSON parsing
      try {
        const jsonData = JSON.parse(rawStr);
        if (Array.isArray(jsonData)) {
          entries.push(...jsonData);
        }
      } catch {
        // Leave entries empty, raw will be shown
      }
    }

    return { status: true, data: { raw: rawStr, entries } };
  } catch (error: any) {
    console.error("[extractRegistrationListAction]", error);
    return { status: false, message: error?.message || "Failed to extract registration list" };
  }
}

export async function validateTransferredXmlAction(clinicUid: string, xmlString: string, tagging: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const credentials = await getClinicCredentials(clinicUid);
    const client = new YakapApiClient();

    const tokenRes = await client.getToken(
      credentials.pUsername,
      credentials.pUserPassword,
      credentials.pSoftwareCertificationId,
      credentials.pHospitalCode
    );

    const token = (tokenRes as any)?.result || (tokenRes as any)?.token || "";

    if (!token || typeof token !== 'string') {
      const errMsg = typeof tokenRes === 'object' && tokenRes !== null ? (tokenRes as any).message : "Failed to authenticate with PhilHealth";
      return { status: false, message: errMsg || "Failed to authenticate with PhilHealth" };
    }

    // validateReport takes the raw XML, encrypts it internally using the cipherKey, and calls SOAP
    const result = await client.validateReport(xmlString, tagging, token, credentials.cipherKey);
    return { status: true, data: result };
  } catch (error: any) {
    console.error("[validateTransferredXmlAction]", error);
    return { status: false, message: error?.message || "Failed to validate XML" };
  }
}

export async function parseXmlImportAction(clinicUid: string, xmlString: string) {
  try {
    let finalXml = xmlString;

    // Check if the input is an encrypted JSON string
    if (xmlString.trim().startsWith('{') && xmlString.includes('"iv"') && xmlString.includes('"doc"')) {
      const { decryptReport } = await import("@/lib/philhealth-yakap/api");
      const credentials = await getClinicCredentials(clinicUid);
      finalXml = decryptReport(xmlString, credentials.cipherKey);
    }

    // Dynamic import of xmlbuilder2 for parsing
    const { convert } = await import("xmlbuilder2");

    const parsed = convert(finalXml, { format: "object" }) as Record<string, unknown>;    // Helper to process an xmlbuilder2 element into a cleaner object
    const processElement = (element: Record<string, unknown>, type: string) => {
      const attrs: Record<string, string> = {};
      const children: { type: string; attributes: Record<string, string> }[] = [];

      for (const [key, value] of Object.entries(element)) {
        if (key.startsWith("@")) {
          attrs[key.slice(1)] = String(value ?? "");
        } else if (typeof value === "object" && value !== null) {
          const childEntries = Array.isArray(value) ? value : [value];
          for (const child of childEntries) {
            if (typeof child === "object" && child !== null) {
              const childAttrs: Record<string, string> = {};
              for (const [ck, cv] of Object.entries(child as Record<string, unknown>)) {
                if (ck.startsWith("@")) childAttrs[ck.slice(1)] = String(cv ?? "");
              }
              children.push({ type: key, attributes: childAttrs });
            }
          }
        }
      }

      return { type, attributes: attrs, children: children.length > 0 ? children : undefined };
    };

    const groupedData: Record<string, any> = {};
    const getPatient = (caseNo: string) => {
      if (!groupedData[caseNo]) {
        groupedData[caseNo] = { pHciCaseNo: caseNo, enlistment: null, profiles: [], soaps: [], diagnostics: [], medicines: [] };
      }
      return groupedData[caseNo];
    };

    const pcb = (parsed as Record<string, unknown>).PCB as Record<string, unknown>;
    if (pcb) {
      // 1. ENLISTMENTS
      if (pcb.ENLISTMENTS) {
        const enlistments = (pcb.ENLISTMENTS as any).ENLISTMENT;
        const arr = Array.isArray(enlistments) ? enlistments : enlistments ? [enlistments] : [];
        for (const item of arr) {
          const processed = processElement(item, "ENLISTMENT");
          const caseNo = processed.attributes.pHciCaseNo;
          if (caseNo) getPatient(caseNo).enlistment = processed;
        }
      }

      // 2. PROFILING
      if (pcb.PROFILING) {
        const profiles = (pcb.PROFILING as any).PROFILE;
        const arr = Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
        for (const item of arr) {
          const processed = processElement(item, "PROFILE");
          const caseNo = processed.attributes.pHciCaseNo;
          if (caseNo) getPatient(caseNo).profiles.push(processed);
        }
      }

      // 3. SOAPS
      if (pcb.SOAPS) {
        const soaps = (pcb.SOAPS as any).SOAP;
        const arr = Array.isArray(soaps) ? soaps : soaps ? [soaps] : [];
        for (const item of arr) {
          const processed = processElement(item, "SOAP");
          const caseNo = processed.attributes.pHciCaseNo;
          if (caseNo) getPatient(caseNo).soaps.push(processed);
        }
      }

      // 4. DIAGNOSTICEXAMRESULTS
      if (pcb.DIAGNOSTICEXAMRESULTS) {
        const diagnostics = (pcb.DIAGNOSTICEXAMRESULTS as any).DIAGNOSTICEXAMRESULT;
        const arr = Array.isArray(diagnostics) ? diagnostics : diagnostics ? [diagnostics] : [];
        for (const item of arr) {
          const processed = processElement(item, "DIAGNOSTICEXAMRESULT");
          const caseNo = processed.attributes.pHciCaseNo;
          if (caseNo) getPatient(caseNo).diagnostics.push(processed);
        }
      }

      // 5. MEDICINES
      if (pcb.MEDICINES) {
        const medicines = (pcb.MEDICINES as any).MEDICINE;
        const arr = Array.isArray(medicines) ? medicines : medicines ? [medicines] : [];
        for (const item of arr) {
          const processed = processElement(item, "MEDICINE");
          const caseNo = processed.attributes.pHciCaseNo;
          if (caseNo) {
            getPatient(caseNo).medicines.push(processed);
          } else {
            // Fallback if missing pHciCaseNo
            getPatient("UNKNOWN").medicines.push(processed);
          }
        }
      }
    }

    return { status: true, data: Object.values(groupedData) };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to parse XML" };
  }
}

export async function importKonsultaDataAction(clinicUid: string, records: any[], selectedItems: string[]) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid } });
    if (!clinic) return { status: false, message: "Clinic not found" };

    const selected = new Set(selectedItems);

    // Group selected items
    const patientsToImport = records.filter(p => selected.has(`patient-${p.pHciCaseNo}`));

    if (patientsToImport.length === 0) {
      return { status: false, message: "No patients selected for import." };
    }

    const summary = { imported: 0, existing: 0, error: 0, errors: [] as string[] };

    for (const patient of patientsToImport) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const caseNo = patient.pHciCaseNo;
          const pin = patient.enlistment?.attributes?.pMemPin
            || patient.enlistment?.attributes?.pPatientPin
            || patient.profiles?.[0]?.attributes?.pPatientPin
            || patient.soaps?.[0]?.attributes?.pPatientPin
            || `UNKNOWN-${caseNo}`;

          const enlistmentSelected = selected.has(`enlistment-${caseNo}`);

          let clinicPatientId: number | undefined;

          // 1. Try to find existing patient by PIN
          const existingRecord = await tx.philHealthRecord.findFirst({
            where: { pin },
            include: { User: { include: { ClinicPatients: { where: { clinicId: clinic.id } } } } }
          });

          let userId: number;
          let isExisting = false;
          if (existingRecord) {
            isExisting = true;
            userId = existingRecord.userId;
            if (existingRecord.User.ClinicPatients.length > 0) {
              clinicPatientId = existingRecord.User.ClinicPatients[0].id;
            } else {
              const cp = await tx.clinicPatient.create({ data: { clinicId: clinic.id, patientId: userId } });
              clinicPatientId = cp.id;
            }
          } else {
            // Create new user (using dummy email if needed)
            const dummyEmail = `ph-${pin}-${Date.now()}@imported.clinicez.com`;
            const attrs = patient.enlistment?.attributes || {};

            const newUser = await tx.user.create({
              data: {
                email: dummyEmail,
                userId: `auth0|${pin}-${Date.now()}`,
                firstName: attrs.pMemFname || "Imported",
                lastName: attrs.pMemLname || "Patient",
                middleName: attrs.pMemMname || "",
                suffix: attrs.pMemExtname || "",
                dob: attrs.pPatientDob ? new Date(attrs.pPatientDob) : undefined,
                gender: attrs.pPatientSex === "M" ? "MALE" : (attrs.pPatientSex === "F" ? "FEMALE" : undefined),
                mobile: attrs.pPatientMobileNo || "",
              }
            });
            userId = newUser.id;

            await tx.philHealthRecord.create({
              data: {
                userId,
                pin,
                memberType: attrs.pPatientType || "MM"
              }
            });

            const cp = await tx.clinicPatient.create({ data: { clinicId: clinic.id, patientId: userId } });
            clinicPatientId = cp.id;
          }

          // 2. Import Enlistment
          if (enlistmentSelected && patient.enlistment) {
            const attrs = patient.enlistment.attributes;
            // Ensure no duplicate enlistment year for this patient
            const year = parseInt(attrs.pEffYear || String(new Date().getFullYear()));

            const existingEnlistment = await tx.philHealthKonsultaEnlistment.findFirst({
              where: { clinicPatientId, year }
            });

            if (!existingEnlistment) {
              await tx.philHealthKonsultaEnlistment.create({
                data: {
                  clinicPatientId,
                  year,
                  hciCaseNo: attrs.pHciCaseNo || "",
                  enlistmentTransNo: attrs.pHciTransNo || "",
                  profilingTransNo: "", // Extracted later if needed
                  memberPin: attrs.pMemPin || pin,
                  status: "ACTIVE"
                }
              });
            }
          }

          // 3. Import SOAPs
          const importedSoaps = new Map<string, number>(); // Map pHciTransNo to consultationTicketId

          for (let i = 0; i < patient.soaps.length; i++) {
            if (selected.has(`soap-${caseNo}-${i}`)) {
              const soap = patient.soaps[i];
              const attrs = soap.attributes;
              const transNo = attrs.pHciTransNo;

              // Avoid duplicate soap trans numbers
              const existingSoap = await tx.consultationTicket.findFirst({ where: { soapTransNo: transNo } });

              let ticketId: number;
              if (existingSoap) {
                ticketId = existingSoap.id;
              } else {
                const ticket = await tx.consultationTicket.create({
                  data: {
                    clinicId: clinic.id,
                    clinicPatientId,
                    subject: "Imported Yakap Encounter",
                    soapTransNo: transNo,
                    caseNumber: attrs.pHciCaseNo,
                    createdAt: attrs.pSoapDate ? new Date(attrs.pSoapDate) : new Date()
                  }
                });
                ticketId = ticket.id;

                // Import ICD Codes
                const icds = soap.children?.find((c: any) => c.type === "ICDS")?.children || [];
                for (const icd of icds) {
                  if (icd.attributes?.pIcdCode) {
                    await tx.consultationDiagnosis.create({
                      data: {
                        consultationTicketId: ticketId,
                        hpId: 1, // Defaulting to an admin HP or dummy for imported records?
                        icd10Code: icd.attributes.pIcdCode,
                        description: "Imported Diagnosis",
                        type: "PRIMARY"
                      }
                    });
                  }
                }
              }
              importedSoaps.set(transNo, ticketId);
            }
          }

          // 4. Import Medicines
          for (let i = 0; i < patient.medicines.length; i++) {
            if (selected.has(`medicine-${caseNo}-${i}`)) {
              const med = patient.medicines[i];
              const attrs = med.attributes;
              const transNo = attrs.pHciTransNo;
              const ticketId = importedSoaps.get(transNo);

              if (ticketId) {
                await tx.medication.create({
                  data: {
                    clinicId: clinic.id,
                    patientId: userId,
                    hpId: 1,
                    consultationTicketId: ticketId,
                    name: attrs.pDrugCode || "Imported Medicine",
                  }
                });
              }
            }
          }
          // End of patient import logic
          return { isExisting };
        });

        if (result.isExisting) {
          summary.existing++;
        } else {
          summary.imported++;
        }
      } catch (e: any) {
        summary.error++;
        summary.errors.push(`Case ${patient.pHciCaseNo}: ${e.message}`);
      }
    }

    return { status: true, summary, message: `Successfully processed ${patientsToImport.length} patients!` };
  } catch (error: any) {
    console.error("[importKonsultaDataAction]", error);
    return { status: false, message: error?.message || "Failed to import data" };
  }
}

export async function importRegistrationListToDbAction(clinicUid: string, entries: any[]) {
  try {
    const session = await getCachedSession();
    if (!session?.user) return { status: false, message: "Unauthorized" };

    const clinic = await prisma.clinic.findUnique({ where: { clinicUid } });
    if (!clinic) return { status: false, message: "Clinic not found" };

    if (!entries || entries.length === 0) {
      return { status: false, message: "No patients selected for import." };
    }

    let importedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    let errors: string[] = [];

    for (const entry of entries) {
      const isDependent = entry.pAssignedType === "DD";
      const patientPin = entry.pAssignedPin?.trim() || "";
      const principalMemberPin = isDependent ? entry.pPrimaryPIN?.trim() || null : null;

      if (!patientPin) continue;

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Try to find existing patient by their actual PIN
          const existingRecord = await tx.philHealthRecord.findFirst({
            where: { pin: patientPin },
            include: { User: { include: { ClinicPatients: { where: { clinicId: clinic.id } } } } }
          });

          if (existingRecord) {
            existingCount++;
            let userId = existingRecord.userId;
            if (existingRecord.User && existingRecord.User.ClinicPatients.length === 0) {
              await tx.clinicPatient.create({ data: { clinicId: clinic.id, patientId: userId } });
            }
          } else {
            // Create new user (using synthetic email with .net domain)
            const dummyEmail = `ph-${patientPin}-${Date.now()}@imported.clinicez.net`;

            let gender: "MALE" | "FEMALE" | undefined;
            if (entry.pAssignedSex === "M") gender = "MALE";
            else if (entry.pAssignedSex === "F") gender = "FEMALE";

            let dob;
            if (entry.pAssignedDateOfBirth) {
              dob = new Date(entry.pAssignedDateOfBirth);
              if (isNaN(dob.getTime())) dob = undefined;
            }

            const newUser = await tx.user.create({
              data: {
                email: dummyEmail,
                userId: `auth0|${patientPin}-${Date.now()}`,
                firstName: entry.pAssignedFirstName || "Imported",
                lastName: entry.pAssignedLastName || "Patient",
                middleName: entry.pAssignedMiddleName || "",
                suffix: entry.pAssignedExtName || "",
                dob,
                gender,
                mobile: entry.pMobileNumber || "",
              }
            });
            const userId = newUser.id;

            await tx.philHealthRecord.create({
              data: {
                userId,
                pin: patientPin,
                principalMemberPin,
                memberType: entry.pAssignedType || (isDependent ? "DD" : "MM")
              }
            });

            await tx.clinicPatient.create({ data: { clinicId: clinic.id, patientId: userId } });
            importedCount++;
          }
        });
      } catch (err: any) {
        errorCount++;
        errors.push(`Failed to import PIN ${patientPin}: ${err.message}`);
      }
    }

    return {
      status: true,
      message: `Import complete. Imported: ${importedCount}, Existing: ${existingCount}, Errors: ${errorCount}`,
      summary: { imported: importedCount, existing: existingCount, error: errorCount, errors }
    };
  } catch (error: any) {
    console.error("[importRegistrationListToDbAction]", error);
    return { status: false, message: error?.message || "Failed to import registration list" };
  }
}
