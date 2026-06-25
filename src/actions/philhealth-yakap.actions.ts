"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { YakapApiClient, decryptReport, encryptReport } from "@/lib/philhealth-yakap/api";
import { revalidatePath } from "next/cache";
import { generatePhilHealthKonsultaTransactionNumber } from "@/services/sequence-generator.service";
import { generateKonsultaXml, type KonsultaPatientData, type KonsultaConsultationData, type KonsultaMedicineData } from "@/lib/philhealth-yakap/xml-generator";

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
    }
  });

  if (!setting) throw new Error("Clinic settings not found");

  const pSoftwareCertificationId = process.env.PHILHEALTH_KONSULTA_SOFTWARE_CERT_ID || '';
  const cipherKey = process.env.PHILHEALTH_KONSULTA_CIPHER_KEY || '';

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

    const year = new Date().getFullYear();

    const existing = await prisma.philHealthKonsultaEnlistment.findUnique({
      where: {
        unique_enlistment_year: { clinicPatientId, year }
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
          clinicPatientId,
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
        clinicPatientId,
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
  return await prisma.philHealthKonsultaEnlistment.findUnique({ where: { unique_enlistment_year: { clinicPatientId, year } } });
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
                    firstName: true, lastName: true, middleName: true, suffix: true,
                    dob: true, gender: true, mobile: true, telephone: true,
                    PhilHealthRecords: { take: 1 },
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

    // Build patient data for XML generator
    const patients: KonsultaPatientData[] = batch.BatchPatients.map(bp => {
      const patient = bp.ClinicPatient.Patient;
      const enlistment = bp.ClinicPatient.PhilHealthKonsultaEnlistments[0];
      const phRecord = patient.PhilHealthRecords?.[0];

      const memberPin = phRecord?.pin || "";
      const patientPin = phRecord?.dependentPin || phRecord?.pin || "";
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

      // Build consultations for Tagging 2
      let consultations: KonsultaConsultationData[] | undefined;
      if (batch.tagging === "2" && bp.selectedTicketIds.length > 0) {
        consultations = bp.ClinicPatient.ConsultationTickets
          .filter(t => bp.selectedTicketIds.includes(t.id))
          .map(t => ({
            hciCaseNo: enlistment?.hciCaseNo || "",
            hciTransNo: t.soapTransNo || "",
            soapDate: formatDate(t.createdAt),
            atc: "WALKEDIN",
            isWalkedIn: "Y" as const,
            coPay: "0",
            transDate: today,
            subjective: {
              illnessHistory: t.subject || "",
              signsSymptoms: "",
              otherComplaint: "",
              painSite: "",
            },
            vitals: {
              systolic: "", diastolic: "", hr: "", rr: "", temp: "",
              height: "", weight: "", bmi: "", zScore: "",
              leftVision: "", rightVision: "", length: "", headCirc: "",
              skinfoldThickness: "", waist: "", hip: "", limbs: "", midUpperArmCirc: "",
            },
            icdCodes: [],
            medicines: [],
          }));
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
          firstName: (patient.firstName || "").toUpperCase(),
          middleName: (patient.middleName || "").toUpperCase(),
          lastName: (patient.lastName || "").toUpperCase(),
          extName: (patient.suffix || "").toUpperCase(),
          dob: formatDate(patient.dob),
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
          hciTransNo: enlistment?.profilingTransNo || "",
          profDate: today,
          atc: "WALKEDIN",
          isWalkedIn: "Y" as const,
          transDate: today,
          vitals: {
            systolic: "", diastolic: "", hr: "", rr: "", temp: "",
            height: "", weight: "", bmi: "", zScore: "",
            leftVision: "", rightVision: "", length: "", headCirc: "",
            skinfoldThickness: "", waist: "", hip: "", limbs: "", midUpperArmCirc: "",
          },
          bloodType: "",
        },
        consultations,
      };
    });

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
    const apiClient = new YakapApiClient();

    const tokenResult = await apiClient.getToken(
      credentials.pUsername, credentials.pUserPassword,
      credentials.pSoftwareCertificationId, credentials.pHospitalCode
    );

    const token = tokenResult?.result || tokenResult?.token || "";
    if (!token) return { status: false, message: "Failed to get API token" };

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

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        status: apiSuccess ? "VALIDATED" : "DRAFT",
        validationResult: validationResultStr,
        validatedAt: apiSuccess ? new Date() : null,
      },
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
    const apiClient = new YakapApiClient();

    const tokenResult = await apiClient.getToken(
      credentials.pUsername, credentials.pUserPassword,
      credentials.pSoftwareCertificationId, credentials.pHospitalCode
    );

    const token = tokenResult?.result || tokenResult?.token || "";
    if (!token) return { status: false, message: "Failed to get API token" };

    const submissionResult = await apiClient.submitReport(
      batch.transmittalNo, batch.xmlPayload, batch.tagging, token, credentials.cipherKey
    );

    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        status: "SUBMITTED",
        submissionResult: JSON.stringify(submissionResult, null, 2),
        submittedAt: new Date(),
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
    if (batch.status === "SUBMITTED") return { status: false, message: "Cannot modify a submitted batch" };

    // Clear validation, keep transmittalNo for reuse
    await prisma.konsultaBatchReport.update({
      where: { id: batchId },
      data: {
        status: "DRAFT",
        xmlPayload: null,
        validationResult: null,
        validatedAt: null,
      },
    });

    // Now regenerate
    return await generateBatchXmlAction(clinicUid, batchId);
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to regenerate XML" };
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

export async function parseXmlImportAction(xmlString: string) {
  try {
    // Dynamic import of xmlbuilder2 for parsing
    const { convert } = await import("xmlbuilder2");

    const parsed = convert(xmlString, { format: "object" }) as Record<string, unknown>;

    // Flatten into records for display
    const records: { type: string; attributes: Record<string, string>; children?: { type: string; attributes: Record<string, string> }[] }[] = [];

    const processElement = (element: Record<string, unknown>, type: string) => {
      const attrs: Record<string, string> = {};
      const children: { type: string; attributes: Record<string, string> }[] = [];

      for (const [key, value] of Object.entries(element)) {
        if (key.startsWith("@")) {
          attrs[key.slice(1)] = String(value ?? "");
        } else if (typeof value === "object" && value !== null) {
          // It's a child element
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

      records.push({ type, attributes: attrs, children: children.length > 0 ? children : undefined });
    };

    const pcb = (parsed as Record<string, unknown>).PCB as Record<string, unknown>;
    if (pcb) {
      // Process top-level collections
      const collections = ["ENLISTMENTS", "PROFILING", "SOAPS", "DIAGNOSTICEXAMRESULTS", "MEDICINES", "DOCUMENTS"];
      for (const collName of collections) {
        const coll = pcb[collName] as Record<string, unknown> | undefined;
        if (coll) {
          for (const [elementName, elements] of Object.entries(coll)) {
            if (elementName.startsWith("@")) continue;
            const arr = Array.isArray(elements) ? elements : [elements];
            for (const el of arr) {
              if (typeof el === "object" && el !== null) {
                processElement(el as Record<string, unknown>, elementName);
              }
            }
          }
        }
      }
    }

    return { status: true, data: records };
  } catch (error: any) {
    return { status: false, message: error?.message || "Failed to parse XML" };
  }
}
