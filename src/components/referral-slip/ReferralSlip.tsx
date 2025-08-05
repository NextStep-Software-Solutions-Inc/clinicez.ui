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
import ReferralSlipItem from "./ReferralSlipItem";
import type { ReferralSlip } from "./ReferralSlipItem";
import { useReferralSlips } from "@/hooks/useReferralSlips";
import { PatientProfile } from "../consultation/ConsultationDetails";

const CreateReferralSlipModal = dynamic(
  () => import("@/components/clinic/clinical-records/referral-slip/CreateReferralSlipModal")
);

export interface ReferralSlipProps {
  consultationTicketId: number;
  clinicUid: string;
  hpIds: number[];
  isArchived?: boolean;
  patientId?: number;
  userInfo?: PatientProfile | null;
}

export default function ReferralSlip({
  consultationTicketId,
  clinicUid,
  hpIds,
  patientId,
  userInfo
}: ReferralSlipProps) {
  const { data: referralSlips, mutate, error, isLoading } = useReferralSlips({
    clinicUid,
    consultationTicketId,
    hpIds,
    patientId
  });

  return (
    <Card className="group/referral-slip">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <FileText className="text-primary" />
              Referral Slips
            </CardTitle>
            <CardDescription>List of all created referral slips</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateReferralSlipModal
                clinicUid={clinicUid ?? ""}
                consultationTicketId={consultationTicketId}
                onCreateReferralSlip={mutate}
                userInfo={userInfo}
                patientId={patientId}
                hpIds={hpIds}
                appointment={{
                  id: consultationTicketId,
                  complaint: ""
                }}
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
          {!isLoading && !error && (
            <Each
              of={referralSlips?.data as ReferralSlip[] ?? []}
              fallback={
                <p className="text-center text-muted-foreground">
                  No recent referral slip to show.
                </p>
              }
              render={(referralSlip: ReferralSlip) => (
                <ReferralSlipItem
                  referralSlip={referralSlip}
                  onUpdated={mutate}
                  hpIds={hpIds}
                  clinicUid={clinicUid}
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
