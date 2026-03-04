"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createUserVitalSignAction } from "@/actions/vitals.action";

// ── Schema (inline, matches the v1 VitalSignFields schema) ───────────────────

// Treat NaN (produced by valueAsNumber on empty inputs) and empty string as undefined
const preprocessOptionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number" && isNaN(val)) return undefined;
    return val;
  },
  z.number().optional()
);

const vitalSignsSchema = z.object({
  height: preprocessOptionalNumber,
  weight: preprocessOptionalNumber,
  temp: preprocessOptionalNumber,
  pulseRate: preprocessOptionalNumber,
  respRate: preprocessOptionalNumber,
  spo2: preprocessOptionalNumber,
  bpSystolic: preprocessOptionalNumber,
  bpDiastolic: preprocessOptionalNumber,
  bmi: preprocessOptionalNumber,
  notes: z.string().optional(),
  dateTaken: z.coerce.date({ required_error: "Date taken is required" }),
});

type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;

// ── Component ────────────────────────────────────────────────────────────────

/** Format a Date to the `datetime-local` input format (yyyy-MM-ddTHH:mm) */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AddVitalsDialogProps {
  /** The Clerk userId of the patient (used by createUserVitalSignAction) */
  patientUserId: string;
  /** Callback after successful save */
  onSaved?: () => void;
}

export function AddVitalsDialog({ patientUserId, onSaved }: AddVitalsDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<VitalSignsFormData>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      dateTaken: new Date(),
      notes: "",
    },
  });

  const handleSubmit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please check the form and fix any errors before saving.");
      return;
    }

    const data = form.getValues();
    setSaving(true);
    try {
      const result = await createUserVitalSignAction({
        ...data,
        userId: patientUserId,
      });
      if (result.status) {
        toast.success("Vital signs recorded");
        form.reset();
        setOpen(false);
        onSaved?.();
      } else {
        toast.error(result.message ?? "Failed to save vital signs");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred while saving vital signs");
    } finally {
      setSaving(false);
    }
  }, [form, patientUserId, onSaved]);

  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
        >
          <Activity className="h-3.5 w-3.5" />
          Add Vitals
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vital Signs</DialogTitle>
          <DialogDescription>
            Record vital signs and anthropometric measurements for this patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Height (cm)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Height in cm"
                {...form.register("height", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.height && (
                <p className="text-xs text-destructive">{form.formState.errors.height.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Weight in kg"
                {...form.register("weight", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.weight && (
                <p className="text-xs text-destructive">{form.formState.errors.weight.message}</p>
              )}
            </div>
          </div>

          {/* Temperature & SpO2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Temperature (°C)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Temperature"
                {...form.register("temp", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.temp && (
                <p className="text-xs text-destructive">{form.formState.errors.temp.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SpO₂ (%)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Oxygen saturation"
                {...form.register("spo2", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.spo2 && (
                <p className="text-xs text-destructive">{form.formState.errors.spo2.message}</p>
              )}
            </div>
          </div>

          {/* Pulse & Resp Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Pulse Rate (bpm)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Pulse rate"
                {...form.register("pulseRate", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.pulseRate && (
                <p className="text-xs text-destructive">{form.formState.errors.pulseRate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Respiratory Rate</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Breaths/min"
                {...form.register("respRate", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.respRate && (
                <p className="text-xs text-destructive">{form.formState.errors.respRate.message}</p>
              )}
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">BP Systolic</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Systolic"
                {...form.register("bpSystolic", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.bpSystolic && (
                <p className="text-xs text-destructive">{form.formState.errors.bpSystolic.message}</p>
              )}
            </div>
            <Separator orientation="vertical" className="h-8 rotate-12 mx-1" />
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">BP Diastolic</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Diastolic"
                {...form.register("bpDiastolic", { valueAsNumber: true })}
                onFocus={selectOnFocus}
              />
              {form.formState.errors.bpDiastolic && (
                <p className="text-xs text-destructive">{form.formState.errors.bpDiastolic.message}</p>
              )}
            </div>
          </div>

          {/* Date Taken */}
          <div className="space-y-1.5">
            <Label className="text-xs">Date Taken</Label>
            <Input
              type="datetime-local"
              defaultValue={toDatetimeLocal(new Date())}
              onChange={(e) => {
                const val = e.target.value;
                form.setValue("dateTaken", val ? new Date(val) : new Date());
              }}
            />
            {form.formState.errors.dateTaken && (
              <p className="text-xs text-destructive">
                {form.formState.errors.dateTaken.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              placeholder="Additional notes…"
              {...form.register("notes")}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Add Vital Signs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
