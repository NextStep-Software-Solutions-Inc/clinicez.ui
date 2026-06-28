"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Footprints,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  togglePhilHealthKonsultaAction,
  updateKonsultaEncounterAction,
  checkProfilingCompletenessAction,
  type ProfilingCompletenessResult,
} from "@/actions/consultation/konsulta-encounter.action";

interface KonsultaEncounterPanelProps {
  ticketId: number;
  clinicPatientId: number | null;
  isPhilHealthKonsulta: boolean;
  konsultaAtcCode: string | null;
  konsultaIsWalkedIn: boolean | null;
  konsultaCoPay: number | null;
  isResolved: boolean;
  onUpdate?: () => void;
  onProfilingChecked?: (isComplete: boolean) => void;
  recommendedServicesText?: string;
}

export default function KonsultaEncounterPanel({
  ticketId,
  clinicPatientId,
  isPhilHealthKonsulta: initialEnabled,
  konsultaAtcCode: initialAtc,
  konsultaIsWalkedIn: initialWalkedIn,
  konsultaCoPay: initialCoPay,
  isResolved,
  onUpdate,
  onProfilingChecked,
  recommendedServicesText,
}: KonsultaEncounterPanelProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [atcCode, setAtcCode] = useState(initialAtc ?? "");
  const [isWalkedIn, setIsWalkedIn] = useState(initialWalkedIn ?? false);
  const [coPay, setCoPay] = useState(initialCoPay?.toString() ?? "");
  const [profiling, setProfiling] = useState<ProfilingCompletenessResult | null>(null);
  const [toggling, startToggling] = useTransition();
  const [saving, startSaving] = useTransition();

  // Sync from props when parent re-fetches
  useEffect(() => {
    setEnabled(initialEnabled);
    setAtcCode(initialAtc ?? "");
    setIsWalkedIn(initialWalkedIn ?? false);
    setCoPay(initialCoPay?.toString() ?? "");
  }, [initialEnabled, initialAtc, initialWalkedIn, initialCoPay]);

  // Check profiling completeness when enabled
  const checkProfiling = useCallback(async () => {
    if (!clinicPatientId) return;
    const result = await checkProfilingCompletenessAction({ clinicPatientId });
    if (result.data) {
      setProfiling(result.data);
      onProfilingChecked?.(result.data.isComplete);
    }
  }, [clinicPatientId, onProfilingChecked]);

  useEffect(() => {
    if (enabled && clinicPatientId) {
      checkProfiling();
    }
  }, [enabled, clinicPatientId, checkProfiling]);

  const handleToggle = (checked: boolean) => {
    startToggling(async () => {
      const result = await togglePhilHealthKonsultaAction({
        ticketId,
        enabled: checked,
      });
      if (result.data) {
        setEnabled(checked);
        toast.success(result.message);
        onUpdate?.();
      } else {
        toast.error("Failed to toggle PhilHealth Konsulta");
      }
    });
  };

  const handleWalkInToggle = (checked: boolean) => {
    setIsWalkedIn(checked);
    const newAtc = checked ? "WALKEDIN" : "";
    setAtcCode(newAtc);
    startSaving(async () => {
      await updateKonsultaEncounterAction({
        ticketId,
        isWalkedIn: checked,
        atcCode: checked ? "WALKEDIN" : null,
      });
      onUpdate?.();
    });
  };

  const handleAtcBlur = () => {
    if (isWalkedIn) return;
    startSaving(async () => {
      await updateKonsultaEncounterAction({
        ticketId,
        atcCode: atcCode || null,
      });
      onUpdate?.();
    });
  };

  const handleCoPayBlur = () => {
    startSaving(async () => {
      await updateKonsultaEncounterAction({
        ticketId,
        coPay: coPay ? parseFloat(coPay) : null,
      });
      onUpdate?.();
    });
  };

  // Collapsed: just the toggle
  if (!enabled) {
    return (
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b border-border/30">
        <Shield className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
        <Label htmlFor="konsulta-toggle" className="text-xs text-muted-foreground cursor-pointer">
          PhilHealth Konsulta
        </Label>
        <Switch
          id="konsulta-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isResolved || toggling}
          className="scale-75"
        />
      </div>
    );
  }

  // Expanded panel
  return (
    <div className="border-b border-teal-200 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-950/20">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-teal-100 dark:border-teal-800/20">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <Label htmlFor="konsulta-toggle-on" className="text-xs font-medium text-teal-700 dark:text-teal-300 cursor-pointer">
            PhilHealth Konsulta
          </Label>
          <Switch
            id="konsulta-toggle-on"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isResolved || toggling}
            className="scale-75"
          />
        </div>
         {/* Walk-in toggle */}
        <div className="flex items-center gap-2">
          <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
          <Label htmlFor="walkin-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Walk-in
          </Label>
          <Switch
            id="walkin-toggle"
            checked={isWalkedIn}
            onCheckedChange={handleWalkInToggle}
            disabled={isResolved || saving}
            className="scale-75"
          />
        </div>
        </div>
        <Badge variant="outline" className={`${recommendedServicesText ? "" : "ml-auto"} text-[10px] h-5 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400 shrink-0`}>
          Tagging 2 — Consultation
        </Badge>
      </div>

      {/* Fields row */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-end gap-4">
       

        {/* ATC Code */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="atc-code" className="text-[10px] text-muted-foreground uppercase tracking-wide">
            ATC Code
          </Label>
          <Input
            id="atc-code"
            value={atcCode}
            onChange={(e) => setAtcCode(e.target.value.toUpperCase())}
            onBlur={handleAtcBlur}
            disabled={isResolved || isWalkedIn || saving}
            placeholder={isWalkedIn ? "WALKEDIN" : "Enter ATC code"}
            className="h-7 w-36 text-xs font-mono"
          />
        </div>

        {/* Co-Pay */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="copay" className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Co-Pay (₱)
          </Label>
          <Input
            id="copay"
            type="number"
            step="0.01"
            min="0"
            value={coPay}
            onChange={(e) => setCoPay(e.target.value)}
            onBlur={handleCoPayBlur}
            disabled={isResolved || saving}
            placeholder="0.00"
            className="h-7 w-28 text-xs"
          />
        </div>
      </div>

      {/* Profiling completeness warning */}
      {profiling && !profiling.isComplete && (
        <div className="px-4 sm:px-6 pb-3">
          <div className="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Incomplete profiling — {profiling.missing.length} section(s) missing for Tagging 1 (FPE)
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {profiling.missing.map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      className="text-[10px] h-4 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                    >
                      ✗ {m}
                    </Badge>
                  ))}
                  {profiling.present.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="text-[10px] h-4 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {profiling?.isComplete && (
        <div className="px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Patient profile is complete for PhilHealth Konsulta
          </div>
        </div>
      )}
      <div className="px-4 sm:px-6 pb-3">
        {recommendedServicesText && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {recommendedServicesText}
          </div>
        )}
      </div>
    </div>
  );
}
