"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface HealthRecordsTabProps {
  patientId: number;
  clinicId: number;
  userId: number;
  patientData: {
    Patient: {
      id: number;
    } | null;
  };
  canEdit: boolean;
  canAdd: boolean;
}

export default function HealthRecordsTab({ patientId, clinicId, userId, patientData, canEdit, canAdd }: HealthRecordsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Health Records
        </CardTitle>
        <CardDescription>
          Patient health history, conditions, and medications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Health records feature coming soon. Will include existing conditions, allergies, medications, and medical history.
        </p>
      </CardContent>
    </Card>
  );
}
