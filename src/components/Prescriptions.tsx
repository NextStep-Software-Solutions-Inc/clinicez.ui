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
import PrescriptionItem from "@components/PrescriptionItem";
import { usePrescriptions } from "@hooks/usePrescription";
const CreatePrescriptionModal = dynamic(
  () => import("@components/prescription/modals/CreatePrescriptionModal")
);

export interface PrescriptionsProps {
  consultationTicketId?: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: string;
}

export default function Prescriptions({ consultationTicketId, clinicUid, hpId, patientId }: PrescriptionsProps) {
  const { data: prescriptions, mutate } = usePrescriptions({
    isArchived: false,
    consultationTicketId,
    clinicUid,
    hpId,
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
                onCreated={mutate}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={prescriptions?.data ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
              No recent prescription to show.
              </p>
            }
            render={(prescription) => (
              <PrescriptionItem prescription={prescription} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter/>
    </Card>
  );
}
