import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getClinicPatientProfileAction } from "@/actions/clinics/get-clinic-patient-profile.action";
import { getCachedSession } from "@/actions/session.action";
import { getHPsAction } from "@/actions/hp.actions";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import ClinicPatientProfileClient from "@/components/v2/patients/ClinicPatientProfileClient";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import type { SerializedPatientHealthRecordsResponse } from "@/types/patient-profile";

export const metadata: Metadata = {
  title: "Patient Profile",
  description: "View and edit patient health record",
};

export const maxDuration = 20;

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

  const refreshFn = getClinicPatientProfileAction.bind(null, {
    clinicUid,
    patientId: numericPatientId,
  }) as () => Promise<SerializedPatientHealthRecordsResponse | null>;

  return (
    <div className="w-full">
      <div className="px-3 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto">
        <Suspense fallback={<div className="py-20 text-center text-slate-500 animate-pulse text-xs font-semibold">Loading patient records...</div>}>
          <ClinicPatientProfileClient
            clinicUid={clinicUid}
            patientId={numericPatientId}
            initialData={patient}
            refreshFn={refreshFn}
            backHref={`/v2/clinic/${clinicUid}/patients`}
            appointmentsHref={`/v2/clinic/${clinicUid}/patients/${patientId}/appointments-consultations`}
            filesHref={`/v2/clinic/${clinicUid}/patients/${patientId}/files`}
            downloadPHRHref={`/api/phr/clinic/${clinicUid}/patients/${patientId}`}
            aiInsightConfig={isProvider && clinicId ? { patientId: numericPatientId, clinicId } : undefined}
          />
        </Suspense>
      </div>
    </div>
  );
}
