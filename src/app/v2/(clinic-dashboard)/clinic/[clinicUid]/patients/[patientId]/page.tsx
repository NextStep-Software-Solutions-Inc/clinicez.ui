import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import { getHPsAction } from "@/actions/hp.actions";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import ProfileClient from "@/app/v2/(patient-dashboard)/profile/profile-client";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import type { SerializedPatientHealthRecordsResponse } from "@/types/patient-profile";
import type { PatientBaseData } from "@/types/patient-profile-tabs";

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
