"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimelineTabProps {
  patientId: number;
  clinicId: number;
}

export default function TimelineTab({ patientId, clinicId }: TimelineTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
        <CardDescription>
          Chronological view of all patient activities and events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Timeline feature coming soon. Will display appointments, profile updates, consultations, and other events.
        </p>
      </CardContent>
    </Card>
  );
}
