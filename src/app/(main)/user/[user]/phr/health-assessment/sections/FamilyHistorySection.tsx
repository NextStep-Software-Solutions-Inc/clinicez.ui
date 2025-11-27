"use client"

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateFamilyMedicalHistoryAction } from "@/actions/family-and-personal-history.action";
import { getHealthConditionsAction } from "@/actions/health-condition.action";
import type { FamilyMedicalHistoryWithCondition, HealthCondition } from "@/types/health-history.types";

interface FamilyHistorySectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: FamilyMedicalHistoryWithCondition[];
}

// Track selected conditions with their details
interface ConditionData {
  conditionId: number;
  details: string;
}

export const FamilyHistorySection = ({
  userId,
  readOnly = false,
  initialData
}: FamilyHistorySectionProps) => {
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
      const selectedIds = initialData.map(fmh => fmh.conditionId);
      setSelectedConditionIds(selectedIds);

      const details: Record<number, ConditionData> = {};
      initialData.forEach(fmh => {
        details[fmh.conditionId] = {
          conditionId: fmh.conditionId,
          details: fmh.details || "",
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
        [conditionId]: { conditionId, details: "" }
      }));
    }
  };

  const handleDetailsChange = (conditionId: number, field: keyof ConditionData, value: string) => {
    setConditionDetails(prev => ({
      ...prev,
      [conditionId]: {
        ...prev[conditionId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        // Convert selected conditions to array format for server action
        const histories = selectedConditionIds.map(conditionId => ({
          conditionId,
          details: conditionDetails[conditionId]?.details || null,
        }));

        const result = await updateFamilyMedicalHistoryAction(userId, histories);
        
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

  // Helper function to determine if a condition needs details input
  const needsDetails = (conditionName: string): boolean => {
    return [
      'Cancer',
      'Hepatitis',
      'Pulmonary Tuberculosis',
      'Extrapulmonary Tuberculosis',
      'Mental Illness',
      'Others',
      'Allergy'
    ].includes(conditionName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Medical History</CardTitle>
        <CardDescription>
          Record medical conditions that run in your family.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading conditions...</p>
        ) : (
          conditions.map((condition) => {
            const isSelected = selectedConditionIds.includes(condition.id);
            const data = conditionDetails[condition.id] || { conditionId: condition.id, details: "" };

            return (
              <div key={condition.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`family-condition-${condition.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleConditionToggle(condition.id)}
                    disabled={readOnly}
                  />
                  <Label
                    htmlFor={`family-condition-${condition.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {condition.name}
                  </Label>
                </div>

                {/* Show details input for applicable conditions */}
                {isSelected && needsDetails(condition.name) && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor={`family-details-${condition.id}`}>
                      {condition.name === 'Cancer' ? 'Organ affected' :
                        condition.name === 'Hepatitis' ? 'Type (A, B, C, etc.)' :
                          condition.name === 'Pulmonary Tuberculosis' || condition.name === 'Extrapulmonary Tuberculosis' ? 'Category/Details' :
                            condition.name === 'Mental Illness' ? 'Specify type' :
                              condition.name === 'Allergy' ? 'Specify allergies' :
                                condition.name === 'Others' ? 'Specify condition' :
                                  'Details'}
                    </Label>
                    <Input
                      id={`family-details-${condition.id}`}
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
            {isPending ? "Saving..." : "Save Family History"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
