import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedSession } from "@/actions/session.action";
import {
  checkPatientHistoryAccessAction,
  getPatientHistoryAction,
} from "@/actions/clinics/get-patient-history.action";
import { ClinicPatientPageHeader } from "@/components/v2/patients/ClinicPatientPageHeader";
import PatientAppointmentsConsultationsClient from "@/components/v2/patients/PatientAppointmentsConsultationsClient";
import { ShieldX } from "lucide-react";

export const metadata: Metadata = {
  title: "Appointments & Consultations",
  description: "View appointment history and consultation notes",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clinicUid: string; patientId: string }>;
}

/** Rendered when the current user does not have access to this page. */
function UnauthorizedView() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <ShieldX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Unauthorized
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          You do not have permission to view this patient&apos;s appointments
          and consultation history.
        </p>
      </div>
    </div>
  );
}

export default async function PatientAppointmentsConsultationsPage({
  params,
}: PageProps) {
  const { clinicUid, patientId } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const numericPatientId = parseInt(patientId, 10);
  if (isNaN(numericPatientId)) notFound();

  // Determine whether the current user may access this page
  const access = await checkPatientHistoryAccessAction(
    clinicUid,
    numericPatientId
  );

  if (!access) return <UnauthorizedView />;

  // Fetch the combined history
  const result = await getPatientHistoryAction({
    clinicUid,
    numericPatientId,
    access,
  });

  if (!result.status || !result.data) throw new Error(result.message);

  const { patient, appointments, consultationTickets } = result.data;

  return (
    <div>
      <ClinicPatientPageHeader
        clinicUid={clinicUid}
        patientId={numericPatientId}
        patientName={patient.fullName}
        mode="appointments-consultations"
      />
      <PatientAppointmentsConsultationsClient
        patientName={patient.fullName}
        appointments={appointments}
        consultationTickets={consultationTickets}
        access={access}
      />
    </div>
  );
}
