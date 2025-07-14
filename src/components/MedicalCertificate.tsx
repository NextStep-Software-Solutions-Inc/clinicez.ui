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
import { getUserAction } from "@/actions/users/user.action";
// Placeholder for MedicalCertificateItem and useMedicalCertificates
// Too lazy to implement right now, will be replaced with actual imports when implemented ~ Kyle
// import MedicalCertificateItem from "@components/MedicalCertificateItem";
// import { useMedicalCertificates } from "@hooks/useMedicalCertificates";
const CreateMedicalCertificateModal = dynamic(
  () => import("@components/clinic/clinical-records/CreateMedicalCertificateModal")
);

export interface MedicalCertificateProps {
  consultationTicketId?: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: string;
}

export default function MedicalCertificate({ consultationTicketId, clinicUid, hpId, patientId }: MedicalCertificateProps) {
  // So many comments!
  // const { data: certificates, mutate } = useMedicalCertificates({
  //   isArchived: false,
  //   consultationTicketId,
  //   clinicUid,
  //   hpId,
  //   patientId,
  // });
  const certificates = { data: [] };
  const mutate = () => {};

  const [userInfo, setUserInfo] = useState<any>(null);
  useEffect(() => {
    async function fetchUser() {
      if (patientId) {
        try {
          const res = await getUserAction(patientId);
          if (res?.message === "User found" && res?.data) {
            setUserInfo(res.data);
          }
        } catch (e) {
          setUserInfo(null);
        }
      }
    }
    fetchUser();
  }, [patientId]);

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
                onCreateMedicalCertificate={mutate}
                userInfo={userInfo}
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
              // <MedicalCertificateItem certificate={certificate} onUpdated={mutate} />
              <div className="border rounded p-2">Medical Certificate Item Placeholder</div>
            )}
          />
        </div>
      </CardContent>
      <CardFooter/>
    </Card>
  );
}