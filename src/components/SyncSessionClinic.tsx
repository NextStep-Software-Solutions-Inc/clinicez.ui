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
    if (clinic?.data) {

      const c = clinic.data;
      
      setSessionClinic(() => ({
        clinicId: c.id,
        clinicUid: c.clinicUid,
        tenantId: c.Tenant.id,
        tenantUid: c.Tenant.tenantUid
      }));
    }
  }, [clinic, setSessionClinic]);
 

  return null;
}
