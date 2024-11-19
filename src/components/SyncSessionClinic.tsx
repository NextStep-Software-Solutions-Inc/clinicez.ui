"use client";

import { useSetAtom } from "jotai";
import { sessionClinicAtom } from "@state/session-clinic";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useClinic } from "@/hooks/useClinic";

interface SyncSessionClinicProps {}

export default function SyncSessionClinic({}: SyncSessionClinicProps) {
  
  const setSessionClinic = useSetAtom(sessionClinicAtom);
  const {clinicUid} = useParams<{clinicUid: string}>();
  const { data: clinic } = useClinic(clinicUid);

  useEffect(() => {
    if (clinic) {
      setSessionClinic(() => ({
        clinicId: clinic?.id,
        clinicUid: clinic?.clinicUid,
        tenantId: clinic?.Tenant.id,
        tenantUid: clinic?.Tenant.tenantUid
      }));
    }
  }, [clinic, setSessionClinic]);
 

  return null;
}
