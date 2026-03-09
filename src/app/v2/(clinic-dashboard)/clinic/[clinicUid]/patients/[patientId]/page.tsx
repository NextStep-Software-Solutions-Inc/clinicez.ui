import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import { getHPsAction } from "@/actions/hp.actions";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import ProfileClient from "@/app/v2/(patient-dashboard)/profile/profile-client";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import type { SerializedPatientHealthRecordsResponse } from "@/types/patient-profile";
import type { PatientBaseData, PatientTabDataMap } from "@/types/patient-profile-tabs";

/** Derives the slim ProfileCard data from the full clinic patient response. */
function toPatientBaseData(p: SerializedPatientHealthRecordsResponse): PatientBaseData {
  return {
    id:             p.id,
    clinicPatientId: p.clinicPatientId ?? null,
    userId:         p.userId,
    firstName:      p.firstName,
    lastName:       p.lastName,
    fullName:       p.fullName,
    picture:        p.picture,
    nickname:       p.nickname,
    suffix:         p.suffix,
    caseNumber:     p.caseNumber,
    age:            p.age,
    bloodType:      p.bloodType,
    gender:         p.gender,
    clinic:         p.clinic,
    badges: {
      hasEmail:                    !!p.email,
      hasMobile:                   !!(p.mobile || p.telephone),
      hasDob:                      !!p.dob,
      hasGender:                   !!p.gender,
      hasBloodType:                !!p.bloodType,
      hasNationality:              !!p.nationality,
      medicalHistoriesCount:       p.medicalHistories.length,
      familyMedicalHistoriesCount: p.familyMedicalHistories.length,
      vitalSignsCount:             p.vitalSigns.length,
      physicalExaminationsCount:   p.physicalExaminations.length,
      hasPersonalHistory:          !!p.personalHistory,
      hasObGyneHistory:            !!p.obGyneHistory,
      pediatricMeasurementsCount:  p.pediatricMeasurements.length,
      userVaccinationsCount:       p.userVaccinations.length,
      userAddressesCount:          p.userAddresses.length,
      userEmergencyContactsCount:  p.userEmergencyContacts.length,
      philHealthRecordsCount:      p.philHealthRecords.length,
      totalDocumentsCount:
        (p.medicalCertificates?.length ?? 0) +
        (p.referralSlips?.length ?? 0) +
        (p.procedureHistory?.length ?? 0),
    },
  }
}

/**
 * Builds the full tab data map from the already-fetched clinic patient response.
 * This prevents ProfileClient's lazy-loading SWR hooks (which resolve via
 * currentUser()) from returning the authenticated user's data instead of the
 * patient's data when a clinic staff member views a patient profile.
 */
function toPatientTabData(p: SerializedPatientHealthRecordsResponse): PatientTabDataMap {
  return {
    overview: {
      email:                   p.email ?? '',
      mobile:                  p.mobile,
      telephone:               p.telephone,
      dob:                     p.dob,
      gender:                  p.gender,
      suffix:                  p.suffix,
      nickname:                p.nickname,
      nationality:             p.nationality,
      religion:                p.religion,
      civilStatus:             p.civilStatus,
      medicalHistoriesCount:   p.medicalHistories.length,
      vitalSignsCount:         p.vitalSigns.length,
      medicalCertificatesCount: p.medicalCertificates?.length ?? 0,
      referralSlipsCount:      p.referralSlips?.length ?? 0,
      latestVitals:            p.latestVitals,
    },
    medical: {
      medicalHistories:       p.medicalHistories,
      familyMedicalHistories: p.familyMedicalHistories,
      surgicalHistories:      p.surgicalHistories,
    },
    vitals: {
      vitalSigns: p.vitalSigns,
      gender:     p.gender,
    },
    exams: {
      physicalExaminations: p.physicalExaminations,
    },
    obgyn: {
      gender:       p.gender,
      obGyneHistory: p.obGyneHistory,
    },
    pediatric: {
      dob:                   p.dob,
      gender:                p.gender,
      pediatricMeasurements: p.pediatricMeasurements,
    },
    addresses: {
      userAddresses: p.userAddresses,
    },
    contacts: {
      userEmergencyContacts: p.userEmergencyContacts,
    },
    lifestyle: {
      personalHistory: p.personalHistory,
    },
    allergies: {
      userAllergies: p.userAllergies,
    },
    vaccinations: {
      userVaccinations: p.userVaccinations,
    },
    disabilities: {
      userDisabilities: p.userDisabilities,
    },
    insurance: {
      philHealthRecords:  p.philHealthRecords,
      medicalCertificates: p.medicalCertificates ?? [],
      referralSlips:      p.referralSlips ?? [],
      procedureHistory:   (p.procedureHistory ?? []).map(ph => ({
        id:            ph.id,
        userId:        ph.userId,
        clinicId:      ph.clinicId,
        procedureType: ph.procedureType ?? null,
        procedureName: ph.procedureName ?? null,
        usedAt:        ph.usedAt,
      })),
    },
  }
}

export const metadata: Metadata = {
  title: "Patient Profile",
  description: "View full patient health record",
};

export const maxDuration = 30;

export const dynamic = "force-dynamic";

interface ClinicPatientProfilePageProps {
  params: Promise<{ clinicUid: string; patientId: string }>;
}

export default async function ClinicPatientProfilePage({
  params,
}: ClinicPatientProfilePageProps) {
  const { clinicUid, patientId } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("User not authenticated");
  }

  const numericPatientId = parseInt(patientId, 10);
  if (isNaN(numericPatientId)) {
    notFound();
  }

  const [patient, myHPs, clinicRecord] = await Promise.all([
    getClinicPatientProfileAction({
      clinicUid,
      patientId: numericPatientId,
    }),
    getHPsAction({ userId: session.user.sub }),
    getClinicAction(clinicUid),
  ]);

  if (!patient) {
    notFound();
  }

  const isProvider = Array.isArray(myHPs) && myHPs.length > 0;
  const clinicId = clinicRecord?.data?.id;

  return (
    <ProfileClient
      patient={toPatientBaseData(patient)}
      prefetchedTabData={toPatientTabData(patient)}
      headerSlot={
        <ClinicPatientPageHeader
          clinicUid={clinicUid}
          patientId={numericPatientId}
          patientName={patient.fullName}
          mode="view"
        />
      }
      editProfileHref={`/v2/clinic/${clinicUid}/patients/${patientId}/edit`}
      filesHref={`/v2/clinic/${clinicUid}/patients/${patientId}/files`}
      filesButtonLabel="Patient Files"
      appointmentsHref={`/v2/clinic/${clinicUid}/patients/${patientId}/appointments-consultations`}
      downloadPHRHref={`/api/phr/clinic/${clinicUid}/patients/${patientId}`}
      aiInsightConfig={isProvider && clinicId ? { patientId: numericPatientId, clinicId } : undefined}
    />
  );
}
