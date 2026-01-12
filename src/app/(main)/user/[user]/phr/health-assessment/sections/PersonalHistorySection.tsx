"use client"

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { upsertPersonalHistoryAction } from "@/actions/family-and-personal-history.action";
import type { PersonalHistory } from "@prisma";

interface PersonalHistorySectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: PersonalHistory | null;
}

export const PersonalHistorySection = ({
  userId,
  readOnly = false,
  initialData
}: PersonalHistorySectionProps) => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    smokingStatus: initialData?.smokingStatus || "",
    numberOfPacksPerYear: initialData?.numberOfPacksPerYear?.toString() || "",
    alcoholStatus: initialData?.alcoholStatus || "",
    numberOfBottlesPerDay: initialData?.numberOfBottlesPerDay?.toString() || "",
    illicitDrugUse: initialData?.illicitDrugUse || "",
    sexuallyActive: initialData?.sexuallyActive || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const result = await upsertPersonalHistoryAction(userId, {
          smokingStatus: formData.smokingStatus || null,
          numberOfPacksPerYear: formData.numberOfPacksPerYear ? parseInt(formData.numberOfPacksPerYear) : null,
          alcoholStatus: formData.alcoholStatus || null,
          numberOfBottlesPerDay: formData.numberOfBottlesPerDay ? parseInt(formData.numberOfBottlesPerDay) : null,
          illicitDrugUse: formData.illicitDrugUse || null,
          sexuallyActive: formData.sexuallyActive || null,
        });

        if (result.status) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to save personal history");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal/Social History</CardTitle>
        <CardDescription>
          Information about smoking, alcohol consumption, drug use, and sexual activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smoking Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Smoking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smokingStatus">Smoking Status</Label>
              <Select
                value={formData.smokingStatus}
                onValueChange={(value) => handleChange("smokingStatus", value)}
                disabled={readOnly}
              >
                <SelectTrigger id="smokingStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Quit">Quit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.smokingStatus === "Yes" || formData.smokingStatus === "Quit") && (
              <div className="space-y-2">
                <Label htmlFor="numberOfPacksPerYear">Number of Packs Per Year</Label>
                <Input
                  id="numberOfPacksPerYear"
                  type="number"
                  value={formData.numberOfPacksPerYear}
                  onChange={(e) => handleChange("numberOfPacksPerYear", e.target.value)}
                  disabled={readOnly}
                  placeholder="e.g., 10"
                />
              </div>
            )}
          </div>
        </div>

        {/* Alcohol Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Alcohol Consumption</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alcoholStatus">Alcohol Status</Label>
              <Select
                value={formData.alcoholStatus}
                onValueChange={(value) => handleChange("alcoholStatus", value)}
                disabled={readOnly}
              >
                <SelectTrigger id="alcoholStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Quit">Quit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.alcoholStatus === "Yes" || formData.alcoholStatus === "Quit") && (
              <div className="space-y-2">
                <Label htmlFor="numberOfBottlesPerDay">Number of Bottles Per Day</Label>
                <Input
                  id="numberOfBottlesPerDay"
                  type="number"
                  value={formData.numberOfBottlesPerDay}
                  onChange={(e) => handleChange("numberOfBottlesPerDay", e.target.value)}
                  disabled={readOnly}
                  placeholder="e.g., 2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Drug Use Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Illicit Drug Use</h3>
          <div className="space-y-2">
            <Label htmlFor="illicitDrugUse">Do you use illicit drugs?</Label>
            <Select
              value={formData.illicitDrugUse}
              onValueChange={(value) => handleChange("illicitDrugUse", value)}
              disabled={readOnly}
            >
              <SelectTrigger id="illicitDrugUse">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sexual Activity Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Sexual Activity</h3>
          <div className="space-y-2">
            <Label htmlFor="sexuallyActive">Are you sexually active?</Label>
            <Select
              value={formData.sexuallyActive}
              onValueChange={(value) => handleChange("sexuallyActive", value)}
              disabled={readOnly}
            >
              <SelectTrigger id="sexuallyActive">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      {!readOnly && (
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Personal History"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
