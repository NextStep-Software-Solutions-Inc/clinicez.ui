import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import ProfileClient from "@/app/v2/(patient-dashboard)/profile/profile-client";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import type { SerializedPatientHealthRecordsResponse } from "@/types/patient-profile";

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

  const patient = await getClinicPatientProfileAction({
    clinicUid,
    patientId: numericPatientId,
  });

  if (!patient) {
    notFound();
  }

  return (
    <ProfileClient
      patient={patient as SerializedPatientHealthRecordsResponse}
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
      downloadPHRHref={`/api/phr/clinic/${clinicUid}/patients/${patientId}/html`}
    />
  );
}
