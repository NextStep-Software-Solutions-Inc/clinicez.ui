import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import { EditProfileClient } from "@/app/v2/(patient-dashboard)/profile/edit/edit-profile-client";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import type { PatientHealthRecordsResponse } from "@/types/patient-profile";

export const metadata: Metadata = {
  title: "Edit Patient Profile",
  description: "Update patient health information",
};

export const maxDuration = 20;

export const dynamic = "force-dynamic";

interface ClinicPatientEditPageProps {
  params: Promise<{ clinicUid: string; patientId: string }>;
}

export default async function ClinicPatientEditPage({
  params,
}: ClinicPatientEditPageProps) {
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

  // Bind the refresh action so the client re-fetches the correct patient
  // (not the authenticated user's own profile) after each section save.
  const refreshFn = getClinicPatientProfileAction.bind(null, {
    clinicUid,
    patientId: numericPatientId,
  }) as () => Promise<PatientHealthRecordsResponse | null>;

  return (
    <EditProfileClient
      initialData={patient as PatientHealthRecordsResponse}
      headerSlot={
        <ClinicPatientPageHeader
          clinicUid={clinicUid}
          patientId={numericPatientId}
          patientName={patient.fullName}
          mode="edit"
        />
      }
      refreshFn={refreshFn}
    />
  );
}
