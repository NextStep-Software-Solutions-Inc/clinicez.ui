"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, Download } from "lucide-react";

interface AuditTrailTabProps {
  patientId: number;
  clinicId: number;
  canExport: boolean;
}

export default function AuditTrailTab({ patientId, clinicId, canExport }: AuditTrailTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of all changes and actions on this patient record
            </CardDescription>
          </div>
          {canExport && (
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Audit trail feature coming soon. Will display field-level changes, who made them, when, and allow filtering/export.
        </p>
      </CardContent>
    </Card>
  );
}
