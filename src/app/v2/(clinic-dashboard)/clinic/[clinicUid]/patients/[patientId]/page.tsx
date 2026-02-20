import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import ProfileClient from "@/app/v2/(patient-dashboard)/profile/profile-client";
import type { SerializedPatientHealthRecordsResponse } from "@/types/patient-profile";

export const metadata: Metadata = {
  title: "Patient Profile",
  description: "View full patient health record",
};

export const maxDuration = 30;

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
    <ProfileClient patient={patient as SerializedPatientHealthRecordsResponse} />
  );
}
