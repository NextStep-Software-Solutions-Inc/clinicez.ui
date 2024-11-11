"use client";

import { useSetAtom } from "jotai";
import { sessionClinicAtom } from "@state/session-clinic";
import { useOrganization } from "@/hooks/useOrganization";
import { useParams } from "next/navigation";
import { useEffect } from "react";

interface SyncSessionClinicProps {}

export default function SyncSessionClinic({}: SyncSessionClinicProps) {
  
  const setSessionClinic = useSetAtom(sessionClinicAtom);
  const {organization: orgUid} = useParams<{organization: string}>();
  const { data: organization } = useOrganization(orgUid);

  useEffect(() => {
    if (organization) {
      setSessionClinic(() => ({
        clinicId: organization?.id,
        clinicUid: organization?.orgUid,
        tenantId: organization?.Tenant.id,
        tenantUid: organization?.Tenant.tenantUid
      }));
    }
  }, [organization, setSessionClinic]);
 

  return null;
}
