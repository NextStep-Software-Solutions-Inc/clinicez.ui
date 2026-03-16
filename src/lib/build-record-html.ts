/**
 * build-record-html.ts
 *
 * Async helpers that fetch a single clinical record by ID, prepare its HTML template
 * and return the rendered HTML string — without triggering a print.
 * Used by the v2 clinic records preview dialog.
 */

import dayjs from "@/lib/day-utils";
import { calculateAge } from "@/lib/utils";
import { formatPatientAddress } from "@/lib/utils/format-patient-address";
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name";
import { safeImageUrlToBase64 } from "@/lib/image-to-base64";
import { promiseWrapper } from "@/lib/with-error-handling";

import { getPrescriptionAction } from "@/actions/clinics/clinical-record/prescription.action";
import { getLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { getImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { getHeartStationRequestAction } from "@/actions/clinics/clinical-record/heart-station.action";
import { getMedicalCertificateAction } from "@/actions/clinics/clinical-record/medical-certificate.action";
import { getReferralSlipAction } from "@/actions/clinics/clinical-record/referral-slip.action";

import { preparePrescription } from "@/lib/prepare-prescription";
import { prepareLaboratoryRequest } from "@/lib/prepare-laboratory-request";
import { prepareImagingStudy } from "@/lib/prepare-imaging-study";
import { prepareHeartStationRequest } from "@/lib/prepare-heart-station-request";
import { prepareMedicalCertificate } from "@/lib/prepare-medical-certificate";
import { prepareReferralSlip } from "@/lib/prepare-referral-slip";

/* ── Prescription ─────────────────────────────────────────────── */
export async function buildPrescriptionHtml(id: number): Promise<string> {
  const res = await promiseWrapper(getPrescriptionAction)(id);
  const data = res.data;
  if (!data) throw new Error("Prescription not found");

  const hp = data.HealthcareProvider;
  const hpProfile = hp?.HPProfile;
  const professionalDetails = hp?.ProfessionalDetails;
  const prescribingDoctorName = formatHealthcareProviderName({
    hpProfile: hpProfile ?? undefined,
    user: hp?.User ?? undefined,
  });
  const licenseNo = professionalDetails?.licenseNumber ?? "";
  const ptrNo = professionalDetails?.ptrNumber ?? "";
  const eSignatureUrl = hpProfile?.eSignatureUrl ?? "";
  const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : "";
  const doctorAddress = Array.isArray(hpProfile?.fields)
    ? (hpProfile.fields as string[]).join(", ")
    : typeof hpProfile?.fields === "string"
    ? hpProfile.fields
    : "";

  const patient = data.ClinicPatient?.Patient;
  const patientName = [patient?.firstName, patient?.middleName, patient?.lastName, patient?.suffix]
    .filter(Boolean)
    .join(" ");
  const age = String(calculateAge(patient?.dob) ?? "");
  const gender = patient?.gender ?? "";
  const address = formatPatientAddress(patient);

  const medicines = (data.Medicines ?? []).map((m) => ({
    name: m.name ?? "",
    dosage: m.dosage ?? null,
    qty: m.qty ?? null,
    unit: m.unit ?? null,
    frequency: m.frequency ?? null,
    duration: m.duration ? String(m.duration) : null,
    notes: m.notes ?? null,
  }));

  return preparePrescription({
    template: data.DocumentTemplate?.htmlContent ?? "",
    patient: { name: patientName, age, gender, address },
    prescription: { medicines, remarks: data.remarks ?? "", createdAt: data.createdAt },
    doctor: { name: prescribingDoctorName, licenseNo, ptrNo, address: doctorAddress, eSignatureBase64 },
  });
}

/* ── Laboratory Request ───────────────────────────────────────── */
export async function buildLabRequestHtml(id: number): Promise<string> {
  const res = await promiseWrapper(getLaboratoryRequestAction)(id);
  const data = res.data;
  if (!data) throw new Error("Laboratory request not found");

  const hp = data.HealthCareProvider;
  const hpProfile = hp?.HPProfile;
  const professionalDetails = hp?.ProfessionalDetails;
  const doctorName = [hpProfile?.title, hpProfile?.name, hpProfile?.suffix].filter(Boolean).join(" ");
  const licenseNo = professionalDetails?.licenseNumber ?? "";
  const ptrNo = professionalDetails?.ptrNumber ?? "";
  const eSignatureUrl = hpProfile?.eSignatureUrl ?? "";
  const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : "";

  const patient = data.ClinicPatient?.Patient ?? {};
  const patientName = [patient.firstName, patient.middleName, patient.lastName, patient.suffix]
    .filter(Boolean)
    .join(" ");
  const age = String(calculateAge(patient.dob) ?? "");
  const gender = patient.gender ?? "";
  const address = formatPatientAddress(patient);
  const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : "";

  const diagnosticsByCategory: Record<string, string[]> = {};
  data.LaboratoryRequestProcedures?.forEach((item) => {
    const procedure = item.LaboratoryProcedure;
    const masterProc = procedure?.MasterProcedure;
    if (procedure) {
      const category = masterProc?.category?.toUpperCase() ?? "OTHER";
      if (!diagnosticsByCategory[category]) diagnosticsByCategory[category] = [];
      diagnosticsByCategory[category].push(masterProc?.name ?? procedure.name);
    }
  });

  return prepareLaboratoryRequest({
    template: data.DocumentTemplate?.htmlContent ?? "",
    patient: { name: patientName, age, gender, address, birthdate },
    doctor: { name: doctorName, licenseNo, ptrNo, address: "", eSignatureBase64 },
    request: { impression: data.impression ?? "", diagnosticsByCategory, createdAt: data.createdAt },
  });
}

/* ── Imaging Study ────────────────────────────────────────────── */
export async function buildImagingStudyHtml(id: number): Promise<string> {
  const res = await promiseWrapper(getImagingStudyAction)(id);
  const data = res.data;
  if (!data) throw new Error("Imaging study not found");

  const hp = data.HealthCareProvider;
  const hpProfile = hp?.HPProfile;
  const professionalDetails = hp?.ProfessionalDetails;
  const doctorName = [hpProfile?.title, hpProfile?.name, hpProfile?.suffix].filter(Boolean).join(" ");
  const licenseNo = professionalDetails?.licenseNumber ?? "";
  const ptrNo = professionalDetails?.ptrNumber ?? "";
  const eSignatureUrl = hpProfile?.eSignatureUrl ?? "";
  const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : "";

  const patient = data.ClinicPatient?.Patient ?? {};
  const patientName = [patient.firstName, patient.middleName, patient.lastName, patient.suffix]
    .filter(Boolean)
    .join(" ");
  const age = String(calculateAge(patient.dob) ?? "");
  const gender = patient.gender ?? "";
  const address = formatPatientAddress(patient);
  const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : "";

  const diagnostics =
    data.ImagingRequestProcedures?.map((item) => {
      const proc = item.ImagingProcedure;
      const masterName = proc.MasterProcedure?.name;
      const clinicName = proc.name;
      return masterName && clinicName && masterName !== clinicName
        ? `${masterName} (${clinicName})`
        : masterName ?? clinicName;
    })
      .filter((name): name is string => !!name) ?? [];

  return prepareImagingStudy({
    template: data.DocumentTemplate?.htmlContent ?? "",
    patient: { name: patientName, age, gender, address, birthdate },
    doctor: { name: doctorName, licenseNo, ptrNo, address: "", eSignatureBase64 },
    study: {
      diagnostics,
      history: data.history ?? "",
      impression: data.impression ?? "",
      requestFor: data.reason ?? "",
      createdAt: data.createdAt,
    },
  });
}

/* ── Heart Station Request ────────────────────────────────────── */
export async function buildHeartStationHtml(id: number): Promise<string> {
  const res = await promiseWrapper(getHeartStationRequestAction)(id);
  const data = res.data;
  if (!data) throw new Error("Heart station request not found");

  const hp = data.HealthCareProvider;
  const hpProfile = hp?.HPProfile;
  const professionalDetails = hp?.ProfessionalDetails;
  const doctorName = [hpProfile?.title, hpProfile?.name, hpProfile?.suffix].filter(Boolean).join(" ");
  const licenseNo = professionalDetails?.licenseNumber ?? "";
  const ptrNo = professionalDetails?.ptrNumber ?? "";
  const eSignatureUrl = hpProfile?.eSignatureUrl ?? "";
  const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : "";

  const patient = data.ClinicPatient?.Patient ?? {};
  const patientName = [patient.firstName, patient.middleName, patient.lastName, patient.suffix]
    .filter(Boolean)
    .join(" ");
  const age = String(calculateAge(patient.dob) ?? "");
  const gender = patient.gender ?? "";
  const address = formatPatientAddress(patient);
  const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : "";

  const diagnostics =
    data.HeartStationRequestProcedures?.map((item) => item.HeartStationProcedure?.name)
      .filter((name): name is string => !!name) ?? [];

  return prepareHeartStationRequest({
    template: data.DocumentTemplate?.htmlContent ?? "",
    patient: { name: patientName, age, gender, address, birthdate },
    doctor: { name: doctorName, licenseNo, ptrNo, address: "", eSignatureBase64 },
    request: {
      diagnostics,
      history: data.history ?? "",
      impression: data.impression ?? "",
      requestFor: data.reason ?? "",
      createdAt: data.createdAt,
    },
  });
}

/* ── Medical Certificate ──────────────────────────────────────── */
export async function buildMedicalCertificateHtml(id: number): Promise<string> {
  const res = await promiseWrapper(getMedicalCertificateAction)(id);
  const data = res.data;
  if (!data) throw new Error("Medical certificate not found");

  const hp = data.HealthCareProvider;
  const hpProfile = hp?.HPProfile;
  const professionalDetails = hp?.ProfessionalDetails;
  const doctorName = formatHealthcareProviderName({
    hpProfile: hpProfile ?? undefined,
    user: hp?.User ?? undefined,
  });
  const licenseNo = professionalDetails?.licenseNumber ?? "";
  const ptrNo = professionalDetails?.ptrNumber ?? "";
  const eSignatureUrl = hpProfile?.eSignatureUrl ?? "";
  const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : "";

  const patient = data.ClinicPatient?.Patient ?? {};
  const patientName = [patient.firstName, patient.middleName, patient.lastName, patient.suffix]
    .filter(Boolean)
    .join(" ");
  const age = String(calculateAge(patient.dob) ?? "");
  const gender = patient.gender ?? "";
  const address = formatPatientAddress(patient);

  return prepareMedicalCertificate({
    template: data.DocumentTemplate?.htmlContent ?? "",
    patient: { name: patientName, age, gender, address },
    doctor: { name: doctorName, licenseNo, ptrNo, eSignatureBase64 },
    certificate: {
      classification: data.Classification?.name ?? "",
      classificationDescription: data.Classification?.description ?? "",
      reason: data.Reason?.name ?? "",
      finding: data.Finding?.name ?? "",
      recommendations: data.remarks ?? "",
      impression: data.impression ?? "",
      createdAt: data.createdAt,
    },
  });
}

/* ── Referral Slip ────────────────────────────────────────────── */
export async function buildReferralSlipHtml(id: number): Promise<string> {
  const res = await promiseWrapper(getReferralSlipAction)(id);
  const data = res.data;
  if (!data) throw new Error("Referral slip not found");

  const referringHP = data.CreatedBy?.HealthcareProvider;
  const referringDoctorName = formatHealthcareProviderName({
    hpProfile: referringHP?.HPProfile ?? undefined,
    user: data.CreatedBy ?? undefined,
  });

  const patient = data.ClinicPatient?.Patient ?? {};
  const patientName = [patient.firstName, patient.middleName, patient.lastName, patient.suffix]
    .filter(Boolean)
    .join(" ");
  const age = String(calculateAge(patient.dob) ?? "");
  const gender = patient.gender ?? "";
  const sex = gender.charAt(0) ?? "";
  const dob = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : "";
  const address = formatPatientAddress(patient);

  return prepareReferralSlip({
    template: data.DocumentTemplate?.htmlContent ?? "",
    patient: { name: patientName, age, sex, dob, address },
    referral: {
      referredToSpecialty: data.referredTo ?? "Not Specified",
      chiefComplaint: data.Appointment?.complaint ?? "",
      briefHistory: data.history ?? "",
      impression: data.impression ?? "",
      recommendation: data.recommendation ?? "",
      reasonForReferral: data.reason ?? "",
      referredBy: referringDoctorName,
      createdAt: data.createdAt,
    },
  });
}
