"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React, { useMemo } from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { Pill } from "lucide-react";
import PrescriptionItem, {
  PrescriptionItemProps
} from "@components/PrescriptionItem";
import { usePrescriptions } from "@hooks/usePrescription";
const CreatePrescriptionModal = dynamic(
  () => import("@components/prescription/modals/CreatePrescriptionModal")
);

export interface PrescriptionsProps {}

export default function Prescriptions({}: PrescriptionsProps) {
  const { data: prescriptions, mutate } = usePrescriptions({});

  const mappedPrescriptions: PrescriptionItemProps["prescription"][] =
    useMemo(() => {
      return (prescriptions?.data ?? []).map((prescription) => {
        return {
          id: prescription.id,
          name: prescription.name ?? "",
          medicationDrugs: prescription.Medication._count.MedicationDrugs,
          completedAt: prescription.Medication.completedAt,
          createdAt: prescription.createdAt,
          patient: {
            userId: prescription.Medication.patientId + "",
            name: "Patient Name"
          }
        };
      });
    }, [prescriptions?.data]);

  return (
    <Card className="group/folder">
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
      <CardContent className="grid gap-1">
        <Each
          of={mappedPrescriptions}
          fallback={
            <p className="text-center text-muted-foreground">
              No recent prescription to show.
            </p>
          }
          render={(prescription) => (
            <PrescriptionItem prescription={prescription} onUpdated={mutate} />
          )}
        />
      </CardContent>
    </Card>
  );
}
