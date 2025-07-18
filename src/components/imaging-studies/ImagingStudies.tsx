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
import { Camera } from "lucide-react";
import { getUserAndAddressAction } from "@/actions/users/user.action";
import { PatientProfile } from "../clinic/clinical-records/CreateMedicalCertificateModal";
import { useImagingStudies } from "@/hooks/useImagingStudies";
import ImagingStudiesItem, { ImagingStudy } from "./ImagingStudiesItem";
const CreateImagingStudiesModal = dynamic(
  () => import("@components/clinic/clinical-records/CreateImagingStudiesModal")
);

export interface ImagingStudiesProps {
  consultationTicketId?: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: number | string;
  userId?: string;
}

export default function ImagingStudies({ consultationTicketId, clinicUid, hpId, patientId, userId }: ImagingStudiesProps) {
  const resolvedPatientId = typeof patientId === "string" ? Number(patientId) : patientId;
  const { data: studies, mutate } = useImagingStudies({
    clinicUid,
    consultationTicketId,
    hpId,
    patientId: resolvedPatientId
  });

  const [userInfo, setUserInfo] = useState<PatientProfile | null>(null);
  useEffect(() => {
    async function fetchUserInfo() {
      if (userId && typeof userId === "string" && userId.trim() !== "") {
        try {
          const res = await getUserAndAddressAction(userId);
          if (res && res?.data) {
            const user = res.data;
            const mapped: PatientProfile = {
              firstName: user.firstName ?? "Unknown",
              middleName: user.middleName ?? undefined,
              lastName: user.lastName ?? undefined,
              suffix: user.suffix ?? undefined,
              dob: user.dob ? user.dob.toString() : undefined,
              gender: user.gender ?? undefined,
              address: user.UserAddresses && user.UserAddresses.length > 0 ? {
                homeAddress: user.UserAddresses[0].address ?? undefined,
                city: user.UserAddresses[0].city ?? undefined,
                state: user.UserAddresses[0].state ?? undefined,
                zipCode: user.UserAddresses[0].zipCode ?? undefined,
                country: user.UserAddresses[0].country ?? undefined,
              } : undefined,
            };
            setUserInfo(mapped);
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
    <Card className="group/imaging-studies">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <Camera className="text-primary" />
              Imaging Studies
            </CardTitle>
            <CardDescription>List of all created imaging studies</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateImagingStudiesModal
                clinicUid={clinicUid ?? ""}
                onCreateImagingStudy={mutate}
                userInfo={userInfo}
                patientId={resolvedPatientId}
                hpId={hpId}
                consultationTicketId={consultationTicketId}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={studies?.data as ImagingStudy[] ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent imaging study to show.
              </p>
            }
            render={(study) => (
              <ImagingStudiesItem study={study} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
