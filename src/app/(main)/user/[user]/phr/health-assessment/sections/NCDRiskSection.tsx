"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const NCDRiskSection = ({ userId, readOnly, initialData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>NCD Risk Assessment</CardTitle>
        <CardDescription>
          Non-Communicable Disease risk screening and cardiovascular assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Many Yes/No fields: dietary habits (highFatDiet, adequateVegetables, adequateFruits), physicallyActive,
          diabetes screening (hasDiabetes, diabetesMedicationStatus, hasPolyphagia, hasPolydipsia, hasPolyuria),
          lab results (FBS/RBS, cholesterol, urine ketone/protein), cardiovascular risk questionnaire (9 yes/no questions),
          riskLevel. Use upsertNCDRiskAssessmentAction.
        </p>
      </CardContent>
    </Card>
  );
};
