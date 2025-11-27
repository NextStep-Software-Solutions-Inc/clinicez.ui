"use client"

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { updateMedicalHistoryAction } from "@/actions/family-and-personal-history.action";
import { getHealthConditionsAction } from "@/actions/health-condition.action";
import type { MedicalHistoryWithCondition, HealthCondition } from "@/types/health-history.types";

interface MedicalHistorySectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: MedicalHistoryWithCondition[];
}

// Track selected conditions with their details
interface ConditionData {
  conditionId: number;
  details: string;
  highestBpSystolic: string;
  highestBpDiastolic: string;
}

export const MedicalHistorySection = ({
  userId,
  readOnly = false,
  initialData
}: MedicalHistorySectionProps) => {
  const [isPending, startTransition] = useTransition();
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([]);
  const [conditionDetails, setConditionDetails] = useState<Record<number, ConditionData>>({});

  // Fetch all available conditions on mount
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const result = await getHealthConditionsAction();
        setConditions(result);
      } catch (error) {
        console.error("Error fetching conditions:", error);
        toast.error("Failed to load health conditions");
      }
    };
    fetchConditions();
  }, []);

  // Initialize selected conditions from initialData
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const selectedIds = initialData.map(mh => mh.conditionId);
      setSelectedConditionIds(selectedIds);

      const details: Record<number, ConditionData> = {};
      initialData.forEach(mh => {
        details[mh.conditionId] = {
          conditionId: mh.conditionId,
          details: mh.details || "",
          highestBpSystolic: mh.highestBpSystolic?.toString() || "",
          highestBpDiastolic: mh.highestBpDiastolic?.toString() || "",
        };
      });
      setConditionDetails(details);
    }
  }, [initialData]);

  const handleConditionToggle = (conditionId: number) => {
    setSelectedConditionIds(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );

    // Initialize empty details for newly selected conditions
    if (!selectedConditionIds.includes(conditionId)) {
      setConditionDetails(prev => ({
        ...prev,
        [conditionId]: {
          conditionId,
          details: "",
          highestBpSystolic: "",
          highestBpDiastolic: "",
        }
      }));
    }
  };

  const handleDetailsChange = (conditionId: number, field: keyof Omit<ConditionData, 'conditionId'>, value: string) => {
    setConditionDetails(prev => ({
      ...prev,
      [conditionId]: {
        ...prev[conditionId],
        conditionId,
        [field]: value,
      }
    }));
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const conditionsToSave = selectedConditionIds.map(conditionId => {
          const data = conditionDetails[conditionId] || { details: "", highestBpSystolic: "", highestBpDiastolic: "" };
          return {
            conditionId,
            details: data.details || null,
            highestBpSystolic: data.highestBpSystolic ? parseInt(data.highestBpSystolic) : null,
            highestBpDiastolic: data.highestBpDiastolic ? parseInt(data.highestBpDiastolic) : null,
          };
        });

        const result = await updateMedicalHistoryAction(userId, {
          conditions: conditionsToSave
        });

        if (result.status) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to save medical history");
      }
    });
  };

  // Helper to check if condition needs details input
  const needsDetails = (conditionName: string) => {
    return ['Cancer', 'Hepatitis', 'Pulmonary Tuberculosis', 'Extrapulmonary Tuberculosis', 'Mental Illness', 'Others'].includes(conditionName);
  };

  // Helper to check if condition is hypertension (needs BP inputs)
  const isHypertension = (conditionName: string) => {
    return conditionName === 'Hypertension';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Medical History</CardTitle>
        <CardDescription>
          Select all conditions that apply to you and provide additional details where needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading conditions...</p>
        ) : (
          conditions.map((condition) => {
            const isSelected = selectedConditionIds.includes(condition.id);
            const data = conditionDetails[condition.id] || { details: "", highestBpSystolic: "", highestBpDiastolic: "" };

            return (
              <div key={condition.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${condition.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleConditionToggle(condition.id)}
                    disabled={readOnly}
                  />
                  <Label
                    htmlFor={`condition-${condition.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {condition.name}
                  </Label>
                </div>

                {/* Hypertension - Show BP inputs */}
                {isSelected && isHypertension(condition.name) && (
                  <div className="ml-6 grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor={`systolic-${condition.id}`}>Highest Systolic</Label>
                      <Input
                        id={`systolic-${condition.id}`}
                        type="number"
                        value={data.highestBpSystolic}
                        onChange={(e) => handleDetailsChange(condition.id, "highestBpSystolic", e.target.value)}
                        disabled={readOnly}
                        placeholder="e.g., 140"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`diastolic-${condition.id}`}>Highest Diastolic</Label>
                      <Input
                        id={`diastolic-${condition.id}`}
                        type="number"
                        value={data.highestBpDiastolic}
                        onChange={(e) => handleDetailsChange(condition.id, "highestBpDiastolic", e.target.value)}
                        disabled={readOnly}
                        placeholder="e.g., 90"
                      />
                    </div>
                  </div>
                )}

                {/* Other conditions - Show details input */}
                {isSelected && needsDetails(condition.name) && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor={`details-${condition.id}`}>
                      {condition.name === 'Cancer' ? 'Organ affected' :
                        condition.name === 'Hepatitis' ? 'Type (A, B, C, etc.)' :
                          condition.name === 'Pulmonary Tuberculosis' || condition.name === 'Extrapulmonary Tuberculosis' ? 'Category/Details' :
                            condition.name === 'Mental Illness' ? 'Specify type' :
                              condition.name === 'Others' ? 'Specify condition' :
                                'Details'}
                    </Label>
                    <Input
                      id={`details-${condition.id}`}
                      value={data.details}
                      onChange={(e) => handleDetailsChange(condition.id, "details", e.target.value)}
                      disabled={readOnly}
                      placeholder="Enter details..."
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
      {!readOnly && (
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Medical History"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
