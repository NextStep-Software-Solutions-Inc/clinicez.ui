"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Check, ChevronsUpDown, X, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getActiveSignsAndSymptomsAction } from "@/actions/super-admin/sign-and-symptom.action";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PHILHEALTH_SIGNS_AND_SYMPTOMS } from "@/lib/philhealth-yakap/signs-and-symptoms-library";
import {
  formatSubjectiveInput,
  OTHERS_SYMPTOM_CODE,
  PAIN_SYMPTOM_CODE,
  parseSignsSymptomsCodes,
  SUBJECTIVE_MAX_LENGTH,
  type SubjectiveStructuredData,
} from "@/lib/philhealth-yakap/subjective-utils";

export type { SubjectiveStructuredData };

interface SignAndSymptomOption {
  id?: string;
  code: string;
  description: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface KonsultaSubjectiveFieldsProps {
  data: SubjectiveStructuredData;
  onChange: (data: SubjectiveStructuredData) => void;
  disabled?: boolean;
}

/**
 * Renders the 4 PhilHealth Yakap structured subjective fields (`<SUBJECTIVE>`):
 * - Chief Complaint / Signs & Symptoms (`pSignsSymptoms` -> `lib_signssymptoms`)
 * - History of Illness (`pIllnessHistory`)
 * - Pain Site (`pPainSite`, gated on `38 - PAIN`)
 * - Other Complaint (`pOtherComplaint`, gated on `X - OTHERS`)
 */
export default function KonsultaSubjectiveFields({
  data,
  onChange,
  disabled = false,
}: KonsultaSubjectiveFieldsProps) {
  const [signsSymptomsLibrary, setSignsSymptomsLibrary] = useState<SignAndSymptomOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await getActiveSignsAndSymptomsAction();
        if (!active) return;
        if (res.success && res.data) {
          setSignsSymptomsLibrary(res.data);
        } else {
          setLoadError(res.error || "Unable to load Signs & Symptoms library.");
        }
      } catch (err) {
        if (!active) return;
        console.error("Failed to load signs and symptoms", err);
        setLoadError("Unable to load Signs & Symptoms library.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const selectedCodes = parseSignsSymptomsCodes(data.signsSymptoms);
  const hasPainSelected = selectedCodes.includes(PAIN_SYMPTOM_CODE);
  const hasOthersSelected = selectedCodes.includes(OTHERS_SYMPTOM_CODE);

  const illnessHistoryValue = formatSubjectiveInput(
    data.illnessHistory ?? "",
    SUBJECTIVE_MAX_LENGTH.illnessHistory
  );
  const painSiteValue = hasPainSelected
    ? formatSubjectiveInput(data.painSite ?? "", SUBJECTIVE_MAX_LENGTH.painSite)
    : "";
  const otherComplaintValue = hasOthersSelected
    ? formatSubjectiveInput(
        data.otherComplaint ?? "",
        SUBJECTIVE_MAX_LENGTH.otherComplaint
      )
    : "";

  const handleFieldChange = (
    field: "illnessHistory" | "painSite" | "otherComplaint",
    rawValue: string
  ) => {
    if (disabled) return;
    const formatted = formatSubjectiveInput(rawValue, SUBJECTIVE_MAX_LENGTH[field]);
    onChange({
      illnessHistory: field === "illnessHistory" ? formatted : illnessHistoryValue,
      signsSymptoms: selectedCodes.join(";"),
      painSite: field === "painSite" ? (hasPainSelected ? formatted : "") : painSiteValue,
      otherComplaint:
        field === "otherComplaint" ? (hasOthersSelected ? formatted : "") : otherComplaintValue,
    });
  };

  const toggleSymptom = (code: string) => {
    if (disabled) return;
    const normalizedCode = code.trim().toUpperCase();
    const exists = selectedCodes.includes(normalizedCode);
    const newCodes = exists
      ? selectedCodes.filter((c) => c !== normalizedCode)
      : [...selectedCodes, normalizedCode];

    const nextHasPain = newCodes.includes(PAIN_SYMPTOM_CODE);
    const nextHasOthers = newCodes.includes(OTHERS_SYMPTOM_CODE);

    onChange({
      illnessHistory: illnessHistoryValue,
      signsSymptoms: newCodes.join(";"),
      painSite: nextHasPain ? painSiteValue : "",
      otherComplaint: nextHasOthers ? otherComplaintValue : "",
    });
  };

  const missingSignsSymptoms = selectedCodes.length === 0;
  const missingIllnessHistory = !illnessHistoryValue.trim();
  const missingPainSite = hasPainSelected && !painSiteValue.trim();
  const missingOtherComplaint = hasOthersSelected && !otherComplaintValue.trim();

  const missingWarnings: string[] = [];
  if (missingSignsSymptoms) missingWarnings.push("Chief Complaint / Signs & Symptoms");
  if (missingIllnessHistory) missingWarnings.push("History of Illness");
  if (missingPainSite) missingWarnings.push("Pain Site (required for 38 - PAIN)");
  if (missingOtherComplaint) missingWarnings.push("Other Complaint (required for X - OTHERS)");

  return (
    <div className="rounded-lg border border-teal-200 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 p-3 mb-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          PhilHealth Yakap — Subjective Fields (Tagging 2)
        </div>
        <span className="text-[10px] text-muted-foreground">
          All text values are normalized to uppercase per PhilHealth SSVTF rules
        </span>
      </div>

      {missingWarnings.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Required for Tagging 2 XML export: <strong>{missingWarnings.join(", ")}</strong>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {/* Chief Complaint / Signs & Symptoms (lib_signssymptoms) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="konsulta-signs-symptoms"
              className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"
            >
              <span>Chief Complaint / Signs &amp; Symptoms</span>
              <span className="text-destructive font-bold" aria-hidden="true">
                *
              </span>
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1 py-0 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300 normal-case font-medium"
              >
                Required · lib_signssymptoms
              </Badge>
            </Label>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="konsulta-signs-symptoms"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-required="true"
                disabled={disabled || isLoading}
                className={cn(
                  "w-full justify-between h-auto min-h-8 py-1 px-3 text-xs font-normal",
                  missingSignsSymptoms && "border-amber-400/80 dark:border-amber-700"
                )}
              >
                <div className="flex flex-wrap gap-1">
                  {selectedCodes.length > 0 ? (
                    selectedCodes.map((code) => {
                      const item = signsSymptomsLibrary.find((s) => s.code === code);
                      const fallbackItem =
                        item ?? PHILHEALTH_SIGNS_AND_SYMPTOMS.find((s) => s.code === code);
                      const labelText = fallbackItem
                        ? `${fallbackItem.code} - ${fallbackItem.description}${!item && !isLoading && !fallbackItem.isActive ? " (INACTIVE)" : ""}`
                        : code;
                      const isConditionalTrigger =
                        code === PAIN_SYMPTOM_CODE || code === OTHERS_SYMPTOM_CODE;

                      return (
                        <Badge
                          key={code}
                          variant={isConditionalTrigger ? "default" : "secondary"}
                          className={cn(
                            "text-[10px] py-0 px-1.5 h-5 flex items-center gap-1 uppercase",
                            isConditionalTrigger && "bg-teal-600 text-white hover:bg-teal-700"
                          )}
                        >
                          <span>{labelText}</span>
                          {!disabled && (
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label={`Remove ${labelText}`}
                              className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSymptom(code);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleSymptom(code);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground pt-0.5">
                      {isLoading
                        ? "Loading PhilHealth Signs & Symptoms..."
                        : "Select chief complaint / signs & symptoms..."}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] sm:w-[440px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search by code (e.g. 38, X) or description..."
                  className="h-8 text-xs"
                />
                <CommandList>
                  <CommandEmpty className="text-xs py-3 text-center px-3">
                    {loadError
                      ? loadError
                      : signsSymptomsLibrary.length === 0
                        ? "No active signs & symptoms found. Seed the library in Super Admin."
                        : "No matching signs or symptoms found."}
                  </CommandEmpty>
                  <CommandGroup className="max-h-56 overflow-y-auto">
                    {signsSymptomsLibrary.map((symptom) => (
                      <CommandItem
                        key={symptom.code}
                        value={`${symptom.code} ${symptom.description}`}
                        keywords={[symptom.code, symptom.description]}
                        onSelect={() => toggleSymptom(symptom.code)}
                        className="text-xs cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedCodes.includes(symptom.code) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-mono font-semibold mr-1.5">{symptom.code}</span>
                        <span className="text-muted-foreground mr-1.5">-</span>
                        <span>{symptom.description}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {!isLoading && (loadError || signsSymptomsLibrary.length === 0) && (
            <p className="text-[11px] text-destructive">
              {loadError || "No active signs & symptoms found. Seed the library in Super Admin."}
            </p>
          )}
          {missingSignsSymptoms && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Select at least one code from the PhilHealth Signs &amp; Symptoms library.
            </p>
          )}
        </div>

        {/* History of Illness (Primary HPI field) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="konsulta-illness-history"
              className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"
            >
              <span>History of Illness</span>
              <span className="text-destructive font-bold" aria-hidden="true">
                *
              </span>
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1 py-0 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300 normal-case font-medium"
              >
                Required
              </Badge>
            </Label>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {illnessHistoryValue.length}/{SUBJECTIVE_MAX_LENGTH.illnessHistory}
            </span>
          </div>
          <Textarea
            id="konsulta-illness-history"
            value={illnessHistoryValue}
            onChange={(e) => handleFieldChange("illnessHistory", e.target.value)}
            disabled={disabled}
            required
            aria-required="true"
            maxLength={SUBJECTIVE_MAX_LENGTH.illnessHistory}
            placeholder="ENTER HISTORY OF PRESENT ILLNESS..."
            rows={3}
            className={cn(
              "text-xs resize-y uppercase",
              missingIllnessHistory && "border-amber-400/80 dark:border-amber-700"
            )}
          />
          {missingIllnessHistory && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              History of Illness is required for PhilHealth Yakap consultation export.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pain Site (Strictly gated on 38 - PAIN) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="konsulta-pain-site"
                className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"
              >
                <span>Pain Site</span>
                {hasPainSelected && (
                  <>
                    <span className="text-destructive font-bold" aria-hidden="true">
                      *
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1 py-0 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300 normal-case font-medium"
                    >
                      Required (38)
                    </Badge>
                  </>
                )}
              </Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {painSiteValue.length}/{SUBJECTIVE_MAX_LENGTH.painSite}
              </span>
            </div>
            <Input
              id="konsulta-pain-site"
              value={painSiteValue}
              onChange={(e) => handleFieldChange("painSite", e.target.value)}
              disabled={disabled || !hasPainSelected}
              required={hasPainSelected}
              aria-required={hasPainSelected}
              maxLength={SUBJECTIVE_MAX_LENGTH.painSite}
              placeholder={
                hasPainSelected
                  ? "SPECIFY PAIN SITE (E.G. HEAD, CHEST, ABDOMEN)..."
                  : "Select 38 - PAIN above to specify pain site"
              }
              className={cn(
                "h-8 text-xs uppercase",
                !hasPainSelected && "bg-muted/50 cursor-not-allowed",
                missingPainSite && "border-amber-500 dark:border-amber-600"
              )}
            />
            {missingPainSite && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Pain Site is required when 38 - PAIN is selected.
              </p>
            )}
          </div>

          {/* Other Complaint (Strictly gated on X - OTHERS) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="konsulta-other-complaint"
                className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"
              >
                <span>Other Complaint</span>
                {hasOthersSelected && (
                  <>
                    <span className="text-destructive font-bold" aria-hidden="true">
                      *
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1 py-0 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300 normal-case font-medium"
                    >
                      Required (X)
                    </Badge>
                  </>
                )}
              </Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {otherComplaintValue.length}/{SUBJECTIVE_MAX_LENGTH.otherComplaint}
              </span>
            </div>
            <Input
              id="konsulta-other-complaint"
              value={otherComplaintValue}
              onChange={(e) => handleFieldChange("otherComplaint", e.target.value)}
              disabled={disabled || !hasOthersSelected}
              required={hasOthersSelected}
              aria-required={hasOthersSelected}
              maxLength={SUBJECTIVE_MAX_LENGTH.otherComplaint}
              placeholder={
                hasOthersSelected
                  ? "SPECIFY OTHER COMPLAINT..."
                  : "Select X - OTHERS above to specify complaint"
              }
              className={cn(
                "h-8 text-xs uppercase",
                !hasOthersSelected && "bg-muted/50 cursor-not-allowed",
                missingOtherComplaint && "border-amber-500 dark:border-amber-600"
              )}
            />
            {missingOtherComplaint && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Other Complaint is required when X - OTHERS is selected.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
