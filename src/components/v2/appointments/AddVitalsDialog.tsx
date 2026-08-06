"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
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

const MEASUREMENT_FIELDS = [
  "height", "weight", "temp", "pulseRate", "respRate",
  "spo2", "bpSystolic", "bpDiastolic",
  "length", "headCircumference", "skinfoldThickness",
  "waistCircumference", "hipCircumference", "limbCircumference",
  "midUpperArmCircumference",
] as const;

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
  // Extended: vision
  visualAcuityLeft: z.string().optional(),
  visualAcuityRight: z.string().optional(),
  // Extended: anthropometrics
  length: preprocessOptionalNumber,
  headCircumference: preprocessOptionalNumber,
  skinfoldThickness: preprocessOptionalNumber,
  waistCircumference: preprocessOptionalNumber,
  hipCircumference: preprocessOptionalNumber,
  limbCircumference: preprocessOptionalNumber,
  midUpperArmCircumference: preprocessOptionalNumber,
}).superRefine((data, ctx) => {
  const hasAny = MEASUREMENT_FIELDS.some((f) => data[f] !== undefined);
  if (!hasAny) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter at least one measurement before saving.",
      path: [],
    });
  }
});

type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;

// ── Component ────────────────────────────────────────────────────────────────

/** Format a Date to the `datetime-local` input format (yyyy-MM-ddTHH:mm) */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

import { calculateAgeInMonths } from "@/lib/pediatric-growth-utils";

interface AddVitalsDialogProps {
  /** The Clerk userId of the patient (used by createUserVitalSignAction) */
  patientUserId: string;
  /** Patient Date of Birth for age-based validation */
  patientDob?: Date | string | null;
  /** Callback after successful save */
  onSaved?: () => void;
}

export function AddVitalsDialog({ patientUserId, patientDob, onSaved }: AddVitalsDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  const ageMonths = patientDob ? calculateAgeInMonths(new Date(patientDob)) : null;
  const isPediatric = ageMonths !== null && ageMonths <= 24;

  const form = useForm<VitalSignsFormData>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      dateTaken: new Date(),
      notes: "",
    },
  });

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && isPediatric) {
      setShowExtended(true);
    }
  }, [isPediatric]);

  const handleSubmit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      const rootMsg = form.formState.errors.root?.message;
      toast.error(rootMsg ?? "Please check the form and fix any errors before saving.");
      return;
    }

    if (isPediatric) {
      const vals = form.getValues();
      const requiredPediatric: { key: keyof VitalSignsFormData; label: string }[] = [
        { key: "length", label: "Length" },
        { key: "headCircumference", label: "Head Circumference" },
        { key: "skinfoldThickness", label: "Skinfold Thickness" },
        { key: "waistCircumference", label: "Waist Circumference" },
        { key: "hipCircumference", label: "Hip Circumference" },
        { key: "limbCircumference", label: "Limb Circumference" },
        { key: "midUpperArmCircumference", label: "Mid-Upper Arm Circumference" },
      ];
      const missing = requiredPediatric.filter((f) => vals[f.key] === undefined || vals[f.key] === null);
      if (missing.length > 0) {
        setShowExtended(true);
        toast.error(`Required pediatric PEPERT fields missing for 0–24 mos patient: ${missing.map(m => m.label).join(", ")}`);
        return;
      }
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              value={toDatetimeLocal(form.watch("dateTaken") || new Date())}
              onChange={(e) => {
                const val = e.target.value;
                form.setValue("dateTaken", val ? new Date(val) : new Date(), { shouldDirty: true });
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

          {/* Extended Measurements (collapsible) */}
          <button
            type="button"
            onClick={() => setShowExtended(!showExtended)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span>Extended Measurements (Vision & Anthropometrics)</span>
            {showExtended ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showExtended && (
            <div className="space-y-4 rounded-lg border border-border/50 p-3">
              {/* Vision */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Left Eye Vision</Label>
                  <Input
                    placeholder="e.g. 20/20"
                    {...form.register("visualAcuityLeft")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Right Eye Vision</Label>
                  <Input
                    placeholder="e.g. 20/20"
                    {...form.register("visualAcuityRight")}
                  />
                </div>
              </div>

              <Separator />

              {/* Anthropometrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Length (cm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Length"
                    {...form.register("length", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Head Circumference (cm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Head circ."
                    {...form.register("headCircumference", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Waist Circumference (cm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Waist circ."
                    {...form.register("waistCircumference", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hip Circumference (cm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Hip circ."
                    {...form.register("hipCircumference", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Skinfold (mm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Skinfold"
                    {...form.register("skinfoldThickness", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Limb Circ. (cm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Limb circ."
                    {...form.register("limbCircumference", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">MUAC (cm)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Mid-upper arm"
                    {...form.register("midUpperArmCircumference", { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                  />
                </div>
              </div>
            </div>
          )}
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
