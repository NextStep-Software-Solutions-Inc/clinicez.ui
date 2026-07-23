"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  createDiagnosticProcedureAction,
  updateDiagnosticProcedureAction,
} from "@/actions/super-admin/diagnostic-procedures-crud.action";

interface DiagnosticProcedureFormProps {
  procedure?: any;
  onSuccess?: () => void;
}

export function DiagnosticProcedureForm({
  procedure,
  onSuccess,
}: DiagnosticProcedureFormProps) {
  const [formData, setFormData] = useState({
    name: procedure?.name || "",
    description: procedure?.description || "",
    category: procedure?.category || "",
    philhealthDiagnosticId: procedure?.philhealthDiagnosticId || "",
    isActive: procedure?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Procedure name is required");
      return;
    }

    if (!formData.category.trim()) {
      toast.error("Category is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (procedure) {
        await updateDiagnosticProcedureAction(procedure.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          philhealthDiagnosticId: formData.philhealthDiagnosticId,
          isActive: formData.isActive,
        });
        toast.success("Procedure updated successfully");
      } else {
        await createDiagnosticProcedureAction({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          philhealthDiagnosticId: formData.philhealthDiagnosticId,
        });
        toast.success("Procedure created successfully");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save procedure"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Procedure Name <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          placeholder="e.g. Complete Blood Count"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
        <Input
          id="category"
          placeholder="e.g. Hematology"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="philhealthDiagnosticId">PhilHealth Diagnostic ID</Label>
        <Input
          id="philhealthDiagnosticId"
          placeholder="e.g. 1"
          value={formData.philhealthDiagnosticId}
          onChange={(e) => setFormData({ ...formData, philhealthDiagnosticId: e.target.value })}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          If applicable, provide the corresponding PhilHealth Diagnostic ID for Yakap module mapping.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {procedure && (
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked === true })
            }
            disabled={isSubmitting}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active Status
          </Label>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : procedure ? "Update Procedure" : "Create Procedure"}
        </Button>
      </div>
    </form>
  );
}
