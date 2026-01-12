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
import LaboratoryRequestItem from "@components/laboratory-requests/LaboratoryRequestItem";
import { PatientProfile } from "../consultation/ConsultationDetails";
import { useLaboratoryRequests } from "@/hooks/useLaboratoryRequests";
const CreateLaboratoryRequestModal = dynamic(
  () => import("@/components/laboratory-requests/CreateLaboratoryRequestModal").then(module => ({ default: module.default }))
);

export interface LaboratoryRequestProps {
  consultationTicketId: number;
  clinicUid: string;
  clinicId: number;
  hpIds: number[];
  isArchived?: boolean;
  patientId?: number;
  userInfo?: PatientProfile | null;
}

export default function LaboratoryRequest({ consultationTicketId, clinicUid, clinicId, hpIds, patientId, userInfo }: LaboratoryRequestProps) {
  const { data: requests, mutate, error, isLoading } = useLaboratoryRequests({
    clinicUid,
    consultationTicketId,
    hpId: hpIds[0],
    patientId
  });
  return (
    <Card className="group/laboratory-request">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <FileText className="text-primary" />
              Laboratory Requests
            </CardTitle>
            <CardDescription>List of all created laboratory requests</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateLaboratoryRequestModal
                clinicUid={clinicUid ?? ""}
                clinicId={clinicId}
                patientId={patientId}
                hpIds={hpIds}
                onCreated={mutate}
                userInfo={userInfo ?? null}
                consultationTicketId={consultationTicketId}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          {isLoading && (
            <p className="text-center text-muted-foreground">Loading laboratory requests...</p>
          )}
          {error && (
            <p className="text-center text-destructive">Error: {error.message}</p>
          )}
          {!isLoading && !error && (
            <Each
              of={requests?.data ?? []}
              fallback={
                <p className="text-center text-muted-foreground">
                  No recent laboratory request to show.
                </p>
              }
              render={(request) => (
                <LaboratoryRequestItem request={request} onUpdated={mutate} hpIds={hpIds} clinicId={clinicId} />
              )}
            />
          )}
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
