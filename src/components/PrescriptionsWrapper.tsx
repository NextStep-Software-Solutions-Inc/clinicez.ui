"use client"

import dynamic from "next/dynamic";
import type { PrescriptionsProps } from "@components/Prescriptions";

const Prescriptions = dynamic(() => import("@components/Prescriptions"), {
  ssr: false,
  loading: () => null
});

export default function PrescriptionsWrapper(props: Partial<PrescriptionsProps>) {
  const hasRequiredPrescriptionProps = (
    p: Partial<PrescriptionsProps>
  ): p is Pick<PrescriptionsProps, "consultationTicketId" | "clinicUid" | "hpIds" | "patientId" | "userInfo"> => {
    return (
      typeof p.consultationTicketId === "number" &&
      typeof p.clinicUid === "string" &&
      Array.isArray(p.hpIds) && p.hpIds.length > 0 &&
      typeof p.patientId === "number" &&
      typeof p.userInfo === "object" && p.userInfo !== null
    )
  }
  if (!hasRequiredPrescriptionProps(props)) {
    return <div className="text-sm text-muted-foreground">Select a consultation to view prescriptions.</div>;
  }
  const { consultationTicketId, clinicUid, hpIds, patientId, userInfo } = props;
  return (
    <Prescriptions
      consultationTicketId={consultationTicketId}
      clinicUid={clinicUid}
      hpIds={hpIds}
      patientId={patientId}
      userInfo={userInfo}
    />
  );
}
