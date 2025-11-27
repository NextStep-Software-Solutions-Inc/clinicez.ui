"use client"

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { upsertFamilyMedicalHistoryAction } from "@/actions/family-and-personal-history.action";
import type { FamilyMedicalHistory } from "@prisma/client";

interface FamilyHistorySectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: FamilyMedicalHistory | null;
}

interface FormData {
  hasAllergy: boolean;
  allergyDetails: string;
  hasAsthma: boolean;
  hasCancer: boolean;
  cancerOrgan: string;
  hasCerebrovascularDisease: boolean;
  hasCoronaryArteryDisease: boolean;
  hasDiabetesMellitus: boolean;
  hasEmphysema: boolean;
  hasEpilepsy: boolean;
  hasHepatitis: boolean;
  hepatitisType: string;
  hasHyperlipidemia: boolean;
  hasHypertension: boolean;
  highestBpSystolic: string;
  highestBpDiastolic: string;
  hasPepticUlcer: boolean;
  hasPneumonia: boolean;
  hasThyroidDisease: boolean;
  hasPulmonaryTuberculosis: boolean;
  pulmonaryTBDetails: string;
  hasExtrapulmonaryTuberculosis: boolean;
  extrapulmonaryTBDetails: string;
  hasUrinaryTractInfection: boolean;
  hasMentalIllness: boolean;
  hasOtherConditions: boolean;
  otherConditionsDetails: string;
}

export const FamilyHistorySection = ({
  userId,
  readOnly = false,
  initialData
}: FamilyHistorySectionProps) => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<FormData>({
    hasAllergy: initialData?.hasAllergy || false,
    allergyDetails: initialData?.allergyDetails || "",
    hasAsthma: initialData?.hasAsthma || false,
    hasCancer: initialData?.hasCancer || false,
    cancerOrgan: initialData?.cancerOrgan || "",
    hasCerebrovascularDisease: initialData?.hasCerebrovascularDisease || false,
    hasCoronaryArteryDisease: initialData?.hasCoronaryArteryDisease || false,
    hasDiabetesMellitus: initialData?.hasDiabetesMellitus || false,
    hasEmphysema: initialData?.hasEmphysema || false,
    hasEpilepsy: initialData?.hasEpilepsy || false,
    hasHepatitis: initialData?.hasHepatitis || false,
    hepatitisType: initialData?.hepatitisType || "",
    hasHyperlipidemia: initialData?.hasHyperlipidemia || false,
    hasHypertension: initialData?.hasHypertension || false,
    highestBpSystolic: initialData?.highestBpSystolic?.toString() || "",
    highestBpDiastolic: initialData?.highestBpDiastolic?.toString() || "",
    hasPepticUlcer: initialData?.hasPepticUlcer || false,
    hasPneumonia: initialData?.hasPneumonia || false,
    hasThyroidDisease: initialData?.hasThyroidDisease || false,
    hasPulmonaryTuberculosis: initialData?.hasPulmonaryTuberculosis || false,
    pulmonaryTBDetails: initialData?.pulmonaryTBDetails || "",
    hasExtrapulmonaryTuberculosis: initialData?.hasExtrapulmonaryTuberculosis || false,
    extrapulmonaryTBDetails: initialData?.extrapulmonaryTBDetails || "",
    hasUrinaryTractInfection: initialData?.hasUrinaryTractInfection || false,
    hasMentalIllness: initialData?.hasMentalIllness || false,
    hasOtherConditions: initialData?.hasOtherConditions || false,
    otherConditionsDetails: initialData?.otherConditionsDetails || "",
  });

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const result = await upsertFamilyMedicalHistoryAction(userId, {
          ...formData,
          highestBpSystolic: formData.highestBpSystolic ? parseInt(formData.highestBpSystolic) : null,
          highestBpDiastolic: formData.highestBpDiastolic ? parseInt(formData.highestBpDiastolic) : null,
        });
        
        if (result.status) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to save family medical history");
      }
    });
  };

  const conditions = [
    { field: "hasAllergy" as const, label: "Allergy", detailsField: "allergyDetails" as const, detailsLabel: "Specify allergies" },
    { field: "hasAsthma" as const, label: "Asthma" },
    { field: "hasCancer" as const, label: "Cancer", detailsField: "cancerOrgan" as const, detailsLabel: "Organ affected" },
    { field: "hasCerebrovascularDisease" as const, label: "Cerebrovascular Disease (Stroke)" },
    { field: "hasCoronaryArteryDisease" as const, label: "Coronary Artery Disease" },
    { field: "hasDiabetesMellitus" as const, label: "Diabetes Mellitus" },
    { field: "hasEmphysema" as const, label: "Emphysema" },
    { field: "hasEpilepsy" as const, label: "Epilepsy / Seizure Disorder" },
    { field: "hasHepatitis" as const, label: "Hepatitis", detailsField: "hepatitisType" as const, detailsLabel: "Type (A, B, C, etc.)" },
    { field: "hasHyperlipidemia" as const, label: "Hyperlipidemia" },
    { 
      field: "hasHypertension" as const, 
      label: "Hypertension (High Blood Pressure)", 
      customDetails: (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="highestBpSystolic">Highest Systolic</Label>
            <Input
              id="highestBpSystolic"
              type="number"
              value={formData.highestBpSystolic}
              onChange={(e) => handleInputChange("highestBpSystolic", e.target.value)}
              disabled={readOnly || !formData.hasHypertension}
              placeholder="e.g., 140"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highestBpDiastolic">Highest Diastolic</Label>
            <Input
              id="highestBpDiastolic"
              type="number"
              value={formData.highestBpDiastolic}
              onChange={(e) => handleInputChange("highestBpDiastolic", e.target.value)}
              disabled={readOnly || !formData.hasHypertension}
              placeholder="e.g., 90"
            />
          </div>
        </div>
      )
    },
    { field: "hasPepticUlcer" as const, label: "Peptic Ulcer" },
    { field: "hasPneumonia" as const, label: "Pneumonia" },
    { field: "hasThyroidDisease" as const, label: "Thyroid Disease" },
    { field: "hasPulmonaryTuberculosis" as const, label: "Pulmonary Tuberculosis", detailsField: "pulmonaryTBDetails" as const, detailsLabel: "Category/Details" },
    { field: "hasExtrapulmonaryTuberculosis" as const, label: "Extrapulmonary Tuberculosis", detailsField: "extrapulmonaryTBDetails" as const, detailsLabel: "Category/Details" },
    { field: "hasUrinaryTractInfection" as const, label: "Urinary Tract Infection" },
    { field: "hasMentalIllness" as const, label: "Mental Illness" },
    { field: "hasOtherConditions" as const, label: "Others", detailsField: "otherConditionsDetails" as const, detailsLabel: "Specify other conditions" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Medical History</CardTitle>
        <CardDescription>
          Record medical conditions that run in your family.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {conditions.map((condition) => (
          <div key={condition.field} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={condition.field}
                checked={formData[condition.field] as boolean}
                onCheckedChange={(checked) => handleCheckboxChange(condition.field, checked as boolean)}
                disabled={readOnly}
              />
              <Label htmlFor={condition.field} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {condition.label}
              </Label>
            </div>
            {condition.customDetails && formData[condition.field] && condition.customDetails}
            {condition.detailsField && formData[condition.field] && (
              <div className="ml-6 space-y-2">
                <Label htmlFor={condition.detailsField}>{condition.detailsLabel}</Label>
                <Input
                  id={condition.detailsField}
                  value={formData[condition.detailsField] as string}
                  onChange={(e) => handleInputChange(condition.detailsField!, e.target.value)}
                  disabled={readOnly}
                  placeholder={`Enter ${condition.detailsLabel?.toLowerCase()}`}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
      {!readOnly && (
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Family History"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
