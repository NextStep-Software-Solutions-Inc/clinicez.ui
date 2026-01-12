"use client"

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { upsertObGyneHistoryAction } from "@/actions/family-and-personal-history.action";
import type { ObGyneHistory } from "@prisma";

interface ObGyneHistorySectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: ObGyneHistory | null;
}

export const ObGyneHistorySection = ({
  userId,
  readOnly = false,
  initialData
}: ObGyneHistorySectionProps) => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    menarche: initialData?.menarche?.toString() || "",
    lastMenstrualPeriod: initialData?.lastMenstrualPeriod ? new Date(initialData.lastMenstrualPeriod).toISOString().split('T')[0] : "",
    menopauseAge: initialData?.menopauseAge?.toString() || "",
    menopauseStatus: initialData?.menopauseStatus || "",
    ageAtFirstSexualIntercourse: initialData?.ageAtFirstSexualIntercourse?.toString() || "",
    birthControlMethod: initialData?.birthControlMethod || "",
    menstrualPeriodDuration: initialData?.menstrualPeriodDuration?.toString() || "",
    menstrualCycleInterval: initialData?.menstrualCycleInterval?.toString() || "",
    numberOfPadsPerDay: initialData?.numberOfPadsPerDay?.toString() || "",
    gravidity: initialData?.gravidity?.toString() || "",
    parity: initialData?.parity?.toString() || "",
    fullTerm: initialData?.fullTerm?.toString() || "",
    premature: initialData?.premature?.toString() || "",
    abortion: initialData?.abortion?.toString() || "",
    livingChildren: initialData?.livingChildren?.toString() || "",
    typeOfDelivery: initialData?.typeOfDelivery || "",
    hasPreEclampsia: initialData?.hasPreEclampsia || false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        const result = await upsertObGyneHistoryAction(userId, {
          menarche: formData.menarche ? parseInt(formData.menarche) : null,
          lastMenstrualPeriod: formData.lastMenstrualPeriod ? new Date(formData.lastMenstrualPeriod) : null,
          menopauseAge: formData.menopauseAge ? parseInt(formData.menopauseAge) : null,
          menopauseStatus: formData.menopauseStatus || null,
          ageAtFirstSexualIntercourse: formData.ageAtFirstSexualIntercourse ? parseInt(formData.ageAtFirstSexualIntercourse) : null,
          birthControlMethod: formData.birthControlMethod || null,
          menstrualPeriodDuration: formData.menstrualPeriodDuration ? parseInt(formData.menstrualPeriodDuration) : null,
          menstrualCycleInterval: formData.menstrualCycleInterval ? parseInt(formData.menstrualCycleInterval) : null,
          numberOfPadsPerDay: formData.numberOfPadsPerDay ? parseInt(formData.numberOfPadsPerDay) : null,
          gravidity: formData.gravidity ? parseInt(formData.gravidity) : null,
          parity: formData.parity ? parseInt(formData.parity) : null,
          fullTerm: formData.fullTerm ? parseInt(formData.fullTerm) : null,
          premature: formData.premature ? parseInt(formData.premature) : null,
          abortion: formData.abortion ? parseInt(formData.abortion) : null,
          livingChildren: formData.livingChildren ? parseInt(formData.livingChildren) : null,
          typeOfDelivery: formData.typeOfDelivery || null,
          hasPreEclampsia: formData.hasPreEclampsia,
        });

        if (result.status) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to save OB-Gyne history");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OB-Gyne History</CardTitle>
        <CardDescription>
          Obstetric and gynecological history for female patients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Menstrual History */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Menstrual History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menarche">Age at Menarche (years)</Label>
              <Input
                id="menarche"
                type="number"
                value={formData.menarche}
                onChange={(e) => handleChange("menarche", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastMenstrualPeriod">Last Menstrual Period</Label>
              <Input
                id="lastMenstrualPeriod"
                type="date"
                value={formData.lastMenstrualPeriod}
                onChange={(e) => handleChange("lastMenstrualPeriod", e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menopauseStatus">Menopause Status</Label>
              <Select
                value={formData.menopauseStatus}
                onValueChange={(value) => handleChange("menopauseStatus", value)}
                disabled={readOnly}
              >
                <SelectTrigger id="menopauseStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menopauseAge">Age at Menopause (years)</Label>
              <Input
                id="menopauseAge"
                type="number"
                value={formData.menopauseAge}
                onChange={(e) => handleChange("menopauseAge", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., 50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menstrualPeriodDuration">Period Duration (days)</Label>
              <Input
                id="menstrualPeriodDuration"
                type="number"
                value={formData.menstrualPeriodDuration}
                onChange={(e) => handleChange("menstrualPeriodDuration", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menstrualCycleInterval">Cycle Interval (days)</Label>
              <Input
                id="menstrualCycleInterval"
                type="number"
                value={formData.menstrualCycleInterval}
                onChange={(e) => handleChange("menstrualCycleInterval", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., 28"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfPadsPerDay">Number of Pads Per Day</Label>
              <Input
                id="numberOfPadsPerDay"
                type="number"
                value={formData.numberOfPadsPerDay}
                onChange={(e) => handleChange("numberOfPadsPerDay", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., 4"
              />
            </div>
          </div>
        </div>

        {/* Sexual and Contraceptive History */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Sexual & Contraceptive History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ageAtFirstSexualIntercourse">Age at First Sexual Intercourse</Label>
              <Input
                id="ageAtFirstSexualIntercourse"
                type="number"
                value={formData.ageAtFirstSexualIntercourse}
                onChange={(e) => handleChange("ageAtFirstSexualIntercourse", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., 18"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthControlMethod">Birth Control Method</Label>
              <Input
                id="birthControlMethod"
                value={formData.birthControlMethod}
                onChange={(e) => handleChange("birthControlMethod", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., Pills, IUD, Condom"
              />
            </div>
          </div>
        </div>

        {/* Pregnancy History */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Pregnancy History</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gravidity">Gravidity (G)</Label>
              <Input
                id="gravidity"
                type="number"
                value={formData.gravidity}
                onChange={(e) => handleChange("gravidity", e.target.value)}
                disabled={readOnly}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parity">Parity (P)</Label>
              <Input
                id="parity"
                type="number"
                value={formData.parity}
                onChange={(e) => handleChange("parity", e.target.value)}
                disabled={readOnly}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullTerm">Full Term</Label>
              <Input
                id="fullTerm"
                type="number"
                value={formData.fullTerm}
                onChange={(e) => handleChange("fullTerm", e.target.value)}
                disabled={readOnly}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premature">Premature</Label>
              <Input
                id="premature"
                type="number"
                value={formData.premature}
                onChange={(e) => handleChange("premature", e.target.value)}
                disabled={readOnly}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abortion">Abortion</Label>
              <Input
                id="abortion"
                type="number"
                value={formData.abortion}
                onChange={(e) => handleChange("abortion", e.target.value)}
                disabled={readOnly}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livingChildren">Living Children</Label>
              <Input
                id="livingChildren"
                type="number"
                value={formData.livingChildren}
                onChange={(e) => handleChange("livingChildren", e.target.value)}
                disabled={readOnly}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typeOfDelivery">Type of Delivery</Label>
              <Input
                id="typeOfDelivery"
                value={formData.typeOfDelivery}
                onChange={(e) => handleChange("typeOfDelivery", e.target.value)}
                disabled={readOnly}
                placeholder="e.g., Normal Spontaneous Delivery, Cesarean"
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="hasPreEclampsia"
                checked={formData.hasPreEclampsia}
                onCheckedChange={(checked) => handleChange("hasPreEclampsia", checked as boolean)}
                disabled={readOnly}
              />
              <Label htmlFor="hasPreEclampsia" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                History of Pre-Eclampsia
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      {!readOnly && (
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save OB-Gyne History"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
