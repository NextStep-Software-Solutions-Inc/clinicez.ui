import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHPsAction } from "@/actions/hp.actions";
import { getCachedSession } from "@/actions/session.action";
import {
  getClinicConsultationQueueAction,
  getPatientConsultationDetailAction,
} from "@/actions/consultation/patient-consultations.action";
import ClinicConsultationsClient from "@/components/v2/consultations/ClinicConsultationsClient";

export const metadata: Metadata = {
  title: "Consultation",
  description: "View and manage consultation notes, prescriptions, and diagnostic requests",
};

export const dynamic = "force-dynamic";

interface ConsultationDetailPageProps {
  params: Promise<{ clinicUid: string; consultationId: string }>;
}

export default async function ConsultationDetailPage({ params }: ConsultationDetailPageProps) {
  const { clinicUid, consultationId } = await params;

  const numericId = parseInt(consultationId, 10);
  if (isNaN(numericId)) notFound();

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const [queueResult, myHPs, detailResult] = await Promise.all([
    getClinicConsultationQueueAction({ clinicUid }),
    getHPsAction({ userId: session.user.sub }),
    getPatientConsultationDetailAction({ clinicUid, ticketId: numericId }),
  ]);

  if (!detailResult.status || !detailResult.data) notFound();

  return (
    <ClinicConsultationsClient
      clinicUid={clinicUid}
      initialItems={queueResult.data?.items ?? []}
      initialTotal={queueResult.data?.total ?? 0}
      initialNextCursor={queueResult.data?.nextCursor ?? null}
      myHPs={myHPs ?? []}
      initialActiveId={numericId}
      initialActiveDetail={detailResult.data}
    />
  );
}
