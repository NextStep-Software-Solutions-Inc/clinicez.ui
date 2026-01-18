"use client";
// @ts-nocheck

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import { HeartPulse } from "lucide-react";
import { useHeartStationRequests } from "@/hooks/useHeartStationRequests";
import HeartStationRequestItem from "@/components/heart-station-requests/HeartStationRequestItem";
import CreateHeartStationRequestModal from "@/components/heart-station-requests/CreateHeartStationRequestModal";
import { PatientProfile } from "@/components/consultation/ConsultationDetails";

export interface HeartStationRequestsProps {
  consultationTicketId: number;
  clinicUid: string;
  clinicId: number;
  hpIds: number[];
  isArchived?: boolean;
  patientId?: number;
  userInfo?: PatientProfile | null;
}

export default function HeartStationRequests({
  consultationTicketId,
  clinicUid,
  clinicId,
  hpIds,
  patientId,
  userInfo,
}: HeartStationRequestsProps) {
  const { data: requests, mutate, error, isLoading } = useHeartStationRequests({
    clinicUid,
    consultationTicketId,
    hpId: hpIds?.[0],
    patientId,
  });

  return (
    <Card className="group/heart-station-request">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg">
              <HeartPulse className="text-primary" />
              Heart Station Requests
            </CardTitle>
            <CardDescription>List of all created heart station requests</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateHeartStationRequestModal
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
      <CardContent className="h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          {isLoading && (
            <p className="text-center text-muted-foreground">Loading heart station requests...</p>
          )}
          {error && (
            <p className="text-center text-destructive">Error: {error.message}</p>
          )}
          {!isLoading && !error && (
            <Each
              of={requests?.data ?? []}
              fallback={
                <p className="text-center text-muted-foreground">
                  No recent heart station request to show.
                </p>
              }
              render={(request) => (
                <HeartStationRequestItem
                  request={request}
                  onUpdated={mutate}
                  hpIds={hpIds}
                  clinicId={clinicId}
                />
              )}
            />
          )}
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
