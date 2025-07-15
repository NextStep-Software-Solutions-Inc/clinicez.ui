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
import { FileText, Pill } from "lucide-react";
import { getUserAction } from "@/actions/users/user.action";
// Placeholder for LaboratoryRequestItem and useLaboratoryRequests
// Will be replaced with actual imports when implemented ~ Kyle
// import LaboratoryRequestItem from "@components/LaboratoryRequestItem";
// import { useLaboratoryRequests } from "@hooks/useLaboratoryRequests";
const CreateLaboratoryRequestModal = dynamic(
  () => import("@components/clinic/clinical-records/CreateLaboratoryRequestModal")
);

export interface LaboratoryRequestProps {
  consultationTicketId?: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: number | string;
}

export default function LaboratoryRequest({ consultationTicketId, clinicUid, hpId, patientId }: LaboratoryRequestProps) {
  // Will be replaced with actual hook when implemented ~ Kyle
  // const { data: requests, mutate } = useLaboratoryRequests({
  //   isArchived: false,
  //   consultationTicketId,
  //   clinicUid,
  //   hpId,
  //   patientId,
  // });
  const requests = { data: [] };
  const mutate = () => { };
  const [userInfo, setUserInfo] = useState<any>(null);

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
                onCreateLaboratoryRequest={mutate}
                userInfo={userInfo}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={requests?.data ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent laboratory request to show.
              </p>
            }
            render={(request) => (
              // <LaboratoryRequestItem request={request} onUpdated={mutate} />
              <div className="border rounded p-2">Laboratory Request Item Placeholder</div>
            )}
          />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
