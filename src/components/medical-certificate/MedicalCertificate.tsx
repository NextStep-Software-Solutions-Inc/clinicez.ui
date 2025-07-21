"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import MedicalCertificateItem from "./MedicalCertificateItem";
import type { MedicalCertificate } from "./MedicalCertificateItem";
import { useMedicalCertificates } from "@/hooks/useMedicalCertificate";
import { PatientProfile } from "../consultation/ConsultationDetails";
const CreateMedicalCertificateModal = dynamic(
  () => import("@/components/medical-certificate/CreateMedicalCertificateModal")
);

export interface MedicalCertificateProps {
  consultationTicketId: number;
  clinicUid: string;
  hpId: number;
  isArchived?: boolean;
  patientId?: number;
  userInfo?: PatientProfile | null;
}

export default function MedicalCertificate({ consultationTicketId, clinicUid, hpId, patientId, userInfo }: MedicalCertificateProps) {

  const { data: certificates, mutate } = useMedicalCertificates({
    clinicUid,
    consultationTicketId,
    hpId,
    patientId
  });

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
                patientId={patientId}
                hpId={hpId}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={certificates?.data as MedicalCertificate[] ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent medical certificate to show.
              </p>
            }
            render={(certificate: MedicalCertificate) => (
              <MedicalCertificateItem certificate={certificate} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}