import type { Metadata } from "next";
import { getHPsAction } from "@/actions/hp.actions";
import { getCachedSession } from "@/actions/session.action";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import { getClinicConsultationQueueAction } from "@/actions/consultation/patient-consultations.action";
import ClinicConsultationsClient from "@/components/v2/consultations/ClinicConsultationsClient";

export const metadata: Metadata = {
  title: "Consultations",
  description: "Clinic consultation queue — view and manage all active and past consultations",
};

export const dynamic = "force-dynamic";

interface ConsultationsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicConsultationsPage({ params }: ConsultationsPageProps) {
  const { clinicUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const [queueResult, myHPs, clinicRecord] = await Promise.all([
    getClinicConsultationQueueAction({ clinicUid }),
    getHPsAction({ userId: session.user.sub }),
    getClinicAction(clinicUid),
  ]);

  return (
    <ClinicConsultationsClient
      clinicUid={clinicUid}
      clinicId={clinicRecord?.data?.id}
      initialItems={queueResult.data?.items ?? []}
      initialTotal={queueResult.data?.total ?? 0}
      initialNextCursor={queueResult.data?.nextCursor ?? null}
      myHPs={myHPs ?? []}
    />
  );
}
