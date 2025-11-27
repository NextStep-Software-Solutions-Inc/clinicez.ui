"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ImmunizationSection = ({ userId, readOnly, initialData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Immunization Record</CardTitle>
        <CardDescription>
          Track your vaccination history across different life stages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Checkboxes grouped by: Children (BCG, Hepatitis B, DPT, OPV, Measles, etc.), Adult (HPV, MMR),
          Pregnant (Tetanus Toxoid), Elderly (Flu, Pneumococcal). Use upsertImmunizationRecordAction.
        </p>
      </CardContent>
    </Card>
  );
};
