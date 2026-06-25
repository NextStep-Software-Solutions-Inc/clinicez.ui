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
