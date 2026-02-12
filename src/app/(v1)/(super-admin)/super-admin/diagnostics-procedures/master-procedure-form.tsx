"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboBox } from "@/components/ComboBox";
import { toast } from "sonner";
import {
  createMasterImagingProcedureAction,
  updateMasterImagingProcedureAction,
  createMasterLaboratoryProcedureAction,
  updateMasterLaboratoryProcedureAction,
  createMasterHeartStationProcedureAction,
  updateMasterHeartStationProcedureAction,
} from "@/actions/super-admin/diagnostics-procedures.action";

const IMAGING_CATEGORIES = [
  "X-Ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
  "PET Scan",
  "Mammography",
  "Fluoroscopy",
];

const LABORATORY_CATEGORIES = [
  "Blood Tests",
  "Urine Tests",
  "Tissue Tests",
  "Chemistry",
  "Microbiology",
  "Hematology",
  "Immunology",
];

const HEART_STATION_CATEGORIES = [
  "ECG",
  "Echocardiography",
  "Stress Test",
  "Holter Monitor",
  "Pacemaker Check",
];

const CATEGORY_MAP = {
  imaging: IMAGING_CATEGORIES,
  laboratory: LABORATORY_CATEGORIES,
  heart_station: HEART_STATION_CATEGORIES,
};

interface MasterProcedureFormProps {
  type: "imaging" | "laboratory" | "heart_station";
  procedure?: any;
  onSuccess?: () => void;
}

export function MasterProcedureForm({
  type,
  procedure,
  onSuccess,
}: MasterProcedureFormProps) {
  const [formData, setFormData] = useState({
    name: procedure?.name || "",
    description: procedure?.description || "",
    category: procedure?.category || "",
    isActive: procedure?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const defaults = CATEGORY_MAP[type] || [];
    const merged = new Set(defaults);

    if (formData.category) {
      merged.add(formData.category);
    }

    return Array.from(merged);
  }, [formData.category, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Procedure name is required");
      return;
    }

    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (procedure?.id) {
        // Update
        if (type === "imaging") {
          await updateMasterImagingProcedureAction({
            id: procedure.id,
            ...formData,
          });
        } else if (type === "laboratory") {
          await updateMasterLaboratoryProcedureAction({
            id: procedure.id,
            ...formData,
          });
        } else {
          await updateMasterHeartStationProcedureAction({
            id: procedure.id,
            ...formData,
          });
        }
        toast.success("Procedure updated successfully");
      } else {
        // Create
        if (type === "imaging") {
          await createMasterImagingProcedureAction(formData);
        } else if (type === "laboratory") {
          await createMasterLaboratoryProcedureAction(formData);
        } else {
          await createMasterHeartStationProcedureAction(formData);
        }
        toast.success("Procedure created successfully");
      }

      onSuccess?.();
      setFormData({
        name: "",
        description: "",
        category: "",
        isActive: true,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save procedure"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Procedure Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="e.g., CT Head"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <ComboBox
          value={formData.category}
          onChange={(value) => setFormData({ ...formData, category: value })}
          options={categories}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked as boolean })
          }
        />
        <Label htmlFor="isActive" className="font-normal">
          Active
        </Label>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : procedure
              ? "Update Procedure"
              : "Create Procedure"}
        </Button>
      </div>
    </form>
  );
}
