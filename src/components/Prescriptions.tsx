"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { Pill } from "lucide-react";
import PrescriptionItem from "@/components/clinic/clinical-records/prescription/PrescriptionItem";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { PatientProfile } from "./consultation/ConsultationDetails";

const CreatePrescriptionModal = dynamic(
  () => import("@components/clinic/clinical-records/prescription/modals/CreatePrescriptionModal"),
);

export interface PrescriptionsProps {
  consultationTicketId: number;
  clinicUid: string;
  hpIds: number[];
  isArchived?: boolean;
  patientId: number;
  userId?: number;
  userInfo: PatientProfile | null;
}

export default function Prescriptions({
  consultationTicketId,
  clinicUid,
  hpIds,
  patientId,
  userInfo
}: PrescriptionsProps) {
  const { prescriptions, mutate, isLoading, isError } = usePrescriptions({
    clinicUid,
    consultationTicketId,
    hpIds,
    patientId,
  });

  return (
    <Card className="group/prescription">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <Pill className="text-primary" />
              Prescriptions
            </CardTitle>
            <CardDescription>Recently created prescriptions</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreatePrescriptionModal
                clinicUid={clinicUid}
                patientId={patientId}
                consultationTicketId={consultationTicketId}
                userInfo={userInfo}
                hpIds={hpIds}
                onCreated={mutate}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          {isLoading && (
            <p className="text-center text-muted-foreground">Loading prescriptions...</p>
          )}
          {isError && (
            <p className="text-center text-destructive">Error: {isError.message}</p>
          )}
          {!isLoading && !isError && (
            <Each
              of={prescriptions ?? []}
              fallback={
                <p className="text-center text-muted-foreground">
                  No recent prescription to show.
                </p>
              }
              render={(prescription) => (
                <PrescriptionItem
                  key={prescription.id}
                  prescription={prescription}
                  onUpdated={mutate}
                  hpIds={hpIds}
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
