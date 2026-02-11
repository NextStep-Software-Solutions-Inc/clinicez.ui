"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

interface ConsultationsTabProps {
  patientId: number;
  clinicId: number;
  clinicUid: string;
}

export default function ConsultationsTab({ patientId, clinicId, clinicUid }: ConsultationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Consultations & EMR
        </CardTitle>
        <CardDescription>
          Patient consultation history and electronic medical records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Consultations feature coming soon. Will display all consultation records, diagnoses, prescriptions, and EMR summaries.
        </p>
      </CardContent>
    </Card>
  );
}
