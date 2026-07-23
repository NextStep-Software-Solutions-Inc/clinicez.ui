import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import { getPatientConsultationsAction } from "@/actions/consultation/patient-consultations.action";
import { getSystemsAction } from "@/actions/system.action";
import { getHPsAction } from "@/actions/hp.actions";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import ConsultationsPageClient from "@/components/v2/consultations/ConsultationsPageClient";

export const metadata: Metadata = {
  title: "Patient Consultations",
  description: "Manage consultation notes, prescriptions, and diagnostic requests",
};

export const dynamic = "force-dynamic";

interface ConsultationsPageProps {
  params: Promise<{ clinicUid: string; patientId: string }>;
}

export default async function PatientConsultationsPage({ params }: ConsultationsPageProps) {
  const { clinicUid, patientId } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const numericPatientId = parseInt(patientId, 10);
  if (isNaN(numericPatientId)) notFound();

  const [patient, myHPs, systems] = await Promise.all([
    getClinicPatientProfileAction({ clinicUid, patientId: numericPatientId }),
    getHPsAction({ userId: session.user.sub }),
    getSystemsAction(clinicUid),
  ]);

  if (!patient) notFound();

  if (!patient.clinicPatientId) {
    throw new Error("Patient is not linked to this clinic");
  }

  const consultationsResult = await getPatientConsultationsAction({
    clinicUid,
    patientUserId: patient.userId,
  });

  return (
    <ConsultationsPageClient
      clinicUid={clinicUid}
      patient={{
        id: patient.id,
        clinicPatientId: patient.clinicPatientId,
        userId: patient.userId,
        fullName: patient.fullName,
        dob: patient.dob,
        gender: patient.gender,
      }}
      initialConsultations={consultationsResult.data ?? []}
      myHPs={myHPs ?? []}
      systems={systems ?? []}
    />
  );
}
