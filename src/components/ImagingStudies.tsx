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
import { Camera, Pill } from "lucide-react";
import { getUserAction } from "@/actions/users/user.action";
// Placeholder for ImagingStudiesItem and useImagingStudies
// Will be replaced with actual imports when implemented ~ Kyle
// import ImagingStudiesItem from "@components/ImagingStudiesItem";
// import { useImagingStudies } from "@hooks/useImagingStudies";
const CreateImagingStudiesModal = dynamic(
  () => import("@components/clinic/clinical-records/CreateImagingStudiesModal")
);

export interface ImagingStudiesProps {
  consultationTicketId?: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: string;
}

export default function ImagingStudies({ consultationTicketId, clinicUid, hpId, patientId }: ImagingStudiesProps) {
  // Will be replaced with actual hook when implemented ~ Kyle
  // const { data: studies, mutate } = useImagingStudies({
  //   isArchived: false,
  //   consultationTicketId,
  //   clinicUid,
  //   hpId,
  //   patientId,
  // });
  const studies = { data: [] };
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
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={studies?.data ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent imaging study to show.
              </p>
            }
            render={(study) => (
              // <ImagingStudiesItem study={study} onUpdated={mutate} />
              <div className="border rounded p-2">Imaging Study Item Placeholder</div>
            )}
          />
        </div>
      </CardContent>
      <CardFooter/>
    </Card>
  );
}
