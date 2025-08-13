"use client"

import dynamic from "next/dynamic";
import type { PrescriptionsProps } from "@components/Prescriptions";

const Prescriptions = dynamic(() => import("@components/Prescriptions"), {
  ssr: false,
  loading: () => null
});

export default function PrescriptionsWrapper(props: Partial<PrescriptionsProps>) {
  const { consultationTicketId, clinicUid, hpIds, patientId, userInfo } = props;
  if (!consultationTicketId || !clinicUid || !hpIds || hpIds.length === 0 || patientId === undefined || userInfo === undefined) {
    return <div className="text-sm text-muted-foreground">Select a consultation to view prescriptions.</div>;
  }
  return <Prescriptions consultationTicketId={consultationTicketId} clinicUid={clinicUid} hpIds={hpIds} patientId={patientId} userInfo={userInfo} />;
}
