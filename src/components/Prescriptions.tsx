import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { Pill } from "lucide-react";
import PrescriptionItem from "@components/PrescriptionItem";
const CreatePrescriptionModal = dynamic(
  () => import("@components/prescription/modals/CreatePrescriptionModal")
);

export interface PrescriptionsProps {}

export default async function Prescriptions({}: PrescriptionsProps) {
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
                prescription={{
                  id: 1,
                  name: "",
                  description: ""
                }}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1">
        <Each
          of={[
            {
              name: `Prescription # 1`,
              medicationsCount: 2,
              createdAt: new Date(),
              patient: {
                userId: "12",
                name: "Wave Ambray"
              }
            }
          ]}
          fallback={
            <p className="text-center text-muted-foreground">
              No recent prescription to show.
            </p>
          }
          render={(prescription) => (
            <PrescriptionItem prescription={prescription} />
          )}
        />
      </CardContent>
    </Card>
  );
}
