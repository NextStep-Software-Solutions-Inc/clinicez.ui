"use server";

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { YakapApiClient } from "@/lib/philhealth-yakap/api";

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

export async function extractRegistrationListAction(clinicUid: string, token: string, pStartDate: string, pEndDate: string) {
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

import { generatePhilHealthKonsultaTransactionNumber } from "@/services/sequence-generator.service";

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
import { revalidatePath } from "next/cache";

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
