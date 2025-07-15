"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React, { useEffect, useState } from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { getClinicPatientByUserIdAction } from "@/actions/clinics/clinic-patient.action";
import MedicalCertificateItem from "./MedicalCertificateItem";
import { useMedicalCertificates } from "@/hooks/useMedicalCertificate";
const CreateMedicalCertificateModal = dynamic(
  () => import("@components/clinic/clinical-records/CreateMedicalCertificateModal")
);

export interface MedicalCertificateProps {
  consultationTicketId: number;
  clinicUid: string;
  hpId: number;
  isArchived?: boolean;
  patientId?: number | string;
}

export default function MedicalCertificate({ consultationTicketId, clinicUid, hpId, patientId }: MedicalCertificateProps) {

  const resolvedPatientId = typeof patientId === "string" ? Number(patientId) : patientId;

  const { data: certificates, mutate } = useMedicalCertificates({
    clinicUid,
    consultationTicketId,
    hpId,
    patientId: resolvedPatientId
  });

  const [userInfo, setUserInfo] = useState<any>(null);
  const [clinicPatientId, setClinicPatientId] = useState<number | undefined>(undefined);
  useEffect(() => {
    async function fetchClinicPatient() {
      if (patientId && clinicUid) {
        if (typeof resolvedPatientId !== "number" || isNaN(resolvedPatientId)) {
          setUserInfo(null);
          setClinicPatientId(undefined);
          return;
        }
        try {
          const res = await getClinicPatientByUserIdAction({ userId: resolvedPatientId, clinicUid });
          if (res?.message === "Clinic Patient found" && res?.data) {
            setUserInfo(res.data.Patient);
            setClinicPatientId(res.data.id);
          }
        } catch (e) {
          setUserInfo(null);
          setClinicPatientId(undefined);
        }
      }
    }
    fetchClinicPatient();
  }, [resolvedPatientId, clinicUid, patientId]);

  return (
    <Card className="group/medical-certificate">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <FileText className="text-primary" />
              Medical Certificates
            </CardTitle>
            <CardDescription>List of all created medical certificates</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateMedicalCertificateModal
                clinicUid={clinicUid ?? ""}
                consultationTicketId={consultationTicketId}
                onCreateMedicalCertificate={mutate}
                userInfo={userInfo}
                patientId={resolvedPatientId}
                hpId={hpId}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={certificates?.data ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent medical certificate to show.
              </p>
            }
            render={(certificate) => (
              <MedicalCertificateItem certificate={certificate} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}