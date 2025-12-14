"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NCDRiskSectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: null; // Placeholder - will be typed when NCD risk model is implemented
}

export const NCDRiskSection = ({
  userId,
  readOnly = false,
  initialData
}: NCDRiskSectionProps) => {
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
