import type { Metadata } from "next";
import { Suspense } from "react";
import { getClinicPatientsAction } from "@/actions/clinics/clinic-patient.action";
import { getCachedSession } from "@/actions/session.action";
import { ClinicPatientsClient } from "@/components/v2/patients/ClinicPatientsClient";
import { PatientListSkeleton } from "@/components/v2/patients/PatientListSkeleton";
import type { ClinicPatientsInitialData } from "@/types/clinic-patients-v2.types";

export const metadata: Metadata = {
  title: "Patients",
  description: "View and manage clinic patients",
};

export const maxDuration = 30;

export const dynamic = "force-dynamic";

interface ClinicPatientsPageProps {
  params: Promise<{ clinicUid: string }>;
}

const PAGE_SIZE = 50;

export default async function ClinicPatientsPage({ params }: ClinicPatientsPageProps) {
  const { clinicUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("User not authenticated");
  }

  // SSR first page — hands off to client for pagination / filtering
  const result = await getClinicPatientsAction({
    clinicUid,
    pageSize: PAGE_SIZE,
  });

  const initialData: ClinicPatientsInitialData = {
    patients: result.data ?? [],
    totalCount: result.total ?? 0,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  };

  return (
    <div className="space-y-0 pb-10">
      <Suspense fallback={<PatientListSkeleton count={8} viewMode="list" />}>
        <ClinicPatientsClient
          clinicUid={clinicUid}
          pageSize={PAGE_SIZE}
          initialData={initialData}
        />
      </Suspense>
    </div>
  );
}
