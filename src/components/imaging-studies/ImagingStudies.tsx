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
import { Camera } from "lucide-react";
import { useImagingStudies } from "@/hooks/useImagingStudies";
import ImagingStudiesItem, { ImagingStudy } from "./ImagingStudiesItem";
import { PatientProfile } from "../consultation/ConsultationDetails";
const CreateImagingStudiesModal = dynamic(
  () => import("@/components/clinic/clinical-records/CreateImagingStudiesModal")
);

export interface ImagingStudiesProps {
  consultationTicketId: number;
  clinicUid: string;
  hpIds: number[];
  isArchived?: boolean;
  patientId?: number;
  userInfo?: PatientProfile | null;
}

export default function ImagingStudies({ consultationTicketId, clinicUid, hpIds, patientId, userInfo }: ImagingStudiesProps) {
  const { data: studies, mutate, error, isLoading } = useImagingStudies({
    clinicUid,
    consultationTicketId,
    hpId: hpIds[0],
    patientId
  });

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
                userInfo={userInfo ?? null}
                patientId={patientId}
                hpIds={hpIds}
                consultationTicketId={consultationTicketId}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          {isLoading && (
            <p className="text-center text-muted-foreground">Loading referral slips...</p>
          )}
          {error && (
            <p className="text-center text-destructive">Error: {error.message}</p>
          )}
          {!isLoading && !error && (<Each
            of={studies?.data as ImagingStudy[] ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent imaging study to show.
              </p>
            }
            render={(study) => (
              <ImagingStudiesItem
                study={study}
                userInfo={userInfo}
                onUpdated={mutate}
                hpIds={hpIds} />
            )}
          />
          )}
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
