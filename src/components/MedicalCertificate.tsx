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
import { getUserAction, GetUser } from "@/actions/users/user.action";
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
  userId?: string;
}

export default function MedicalCertificate({ consultationTicketId, clinicUid, hpId, patientId, userId }: MedicalCertificateProps) {

  const resolvedPatientId = typeof patientId === "string" ? Number(patientId) : patientId;

  const { data: certificates, mutate } = useMedicalCertificates({
    clinicUid,
    consultationTicketId,
    hpId,
    patientId: resolvedPatientId
  });

  const [userInfo, setUserInfo] = useState<GetUser["data"] | null>(null);
  useEffect(() => {
    async function fetchUserInfo() {
      if (userId && typeof userId === "string" && userId.trim() !== "") {
        try {
          const res = await getUserAction(userId);
          if (res && res?.data) {
            setUserInfo(res.data);
          } else {
            setUserInfo(null);
          }
        } catch (e) {
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
    }
    fetchUserInfo();
  }, [userId]);

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