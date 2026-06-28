"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  createKonsultaRecommendedServiceAction,
  updateKonsultaRecommendedServiceAction,
} from "@/actions/super-admin/konsulta-recommended-services-crud.action";
import { Gender } from "@prisma/client";

interface KonsultaRecommendedServiceFormProps {
  service?: any;
  onSuccess?: () => void;
}

export function KonsultaRecommendedServiceForm({
  service,
  onSuccess,
}: KonsultaRecommendedServiceFormProps) {
  const [formData, setFormData] = useState({
    minAgeMonths: service?.minAgeMonths?.toString() || "",
    maxAgeMonths: service?.maxAgeMonths?.toString() || "",
    gender: service?.gender || "ANY",
    consultationDescription: service?.consultationDescription || "",
    philhealthDiagnosticIds: service?.philhealthDiagnosticIds?.join(", ") || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consultationDescription.trim()) {
      toast.error("Description is required");
      return;
    }

    const ids = formData.philhealthDiagnosticIds
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    if (ids.length === 0) {
      toast.error("At least one PhilHealth Diagnostic ID is required");
      return;
    }

    setIsSubmitting(true);

    const dataPayload = {
      minAgeMonths: formData.minAgeMonths ? parseInt(formData.minAgeMonths, 10) : null,
      maxAgeMonths: formData.maxAgeMonths ? parseInt(formData.maxAgeMonths, 10) : null,
      gender: formData.gender === "ANY" ? null : (formData.gender as Gender),
      consultationDescription: formData.consultationDescription.trim(),
      philhealthDiagnosticIds: ids,
    };

    try {
      if (service) {
        await updateKonsultaRecommendedServiceAction(service.id, dataPayload);
        toast.success("Service rule updated successfully");
      } else {
        await createKonsultaRecommendedServiceAction(dataPayload);
        toast.success("Service rule created successfully");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save service rule"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minAgeMonths">Min Age (Months)</Label>
          <Input
            id="minAgeMonths"
            type="number"
            placeholder="e.g. 0"
            value={formData.minAgeMonths}
            onChange={(e) => setFormData({ ...formData, minAgeMonths: e.target.value })}
            disabled={isSubmitting}
            min={0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAgeMonths">Max Age (Months)</Label>
          <Input
            id="maxAgeMonths"
            type="number"
            placeholder="e.g. 120"
            value={formData.maxAgeMonths}
            onChange={(e) => setFormData({ ...formData, maxAgeMonths: e.target.value })}
            disabled={isSubmitting}
            min={0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select Gender Restriction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any / Not Specified</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="consultationDescription">
          Consultation Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="consultationDescription"
          placeholder="e.g. Recommended Consult: History and physical examination..."
          value={formData.consultationDescription}
          onChange={(e) => setFormData({ ...formData, consultationDescription: e.target.value })}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="philhealthDiagnosticIds">
          PhilHealth Diagnostic IDs (Comma-Separated) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="philhealthDiagnosticIds"
          placeholder="e.g. 1, 2, 5, 6"
          value={formData.philhealthDiagnosticIds}
          onChange={(e) => setFormData({ ...formData, philhealthDiagnosticIds: e.target.value })}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Enter the PhilHealth IDs of the required diagnostic procedures separated by commas.
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : service ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}
