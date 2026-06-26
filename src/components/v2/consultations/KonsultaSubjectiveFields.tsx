"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck } from "lucide-react";

export interface SubjectiveStructuredData {
  illnessHistory: string;
  signsSymptoms: string;
  painSite: string;
  otherComplaint: string;
}

interface KonsultaSubjectiveFieldsProps {
  data: SubjectiveStructuredData;
  onChange: (data: SubjectiveStructuredData) => void;
  disabled?: boolean;
}

/**
 * Renders the 4 PhilHealth Konsulta structured subjective fields:
 * - Illness History (pIllnessHistory)
 * - Signs & Symptoms (pSignsSymptoms)
 * - Pain Site (pPainSite)
 * - Other Complaint (pOtherComplaint)
 *
 * Displayed above the free-text markdown editor when the consultation
 * is PhilHealth Konsulta-enabled and the current section is "subjective".
 */
export default function KonsultaSubjectiveFields({
  data,
  onChange,
  disabled = false,
}: KonsultaSubjectiveFieldsProps) {
  const handleChange = (field: keyof SubjectiveStructuredData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="rounded-lg border border-teal-200 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 p-3 mb-3 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        PhilHealth Konsulta — Subjective Fields
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Illness History */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-illness-history" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Illness History
          </Label>
          <Textarea
            id="konsulta-illness-history"
            value={data.illnessHistory}
            onChange={(e) => handleChange("illnessHistory", e.target.value)}
            disabled={disabled}
            placeholder="History of present illness..."
            rows={2}
            className="text-xs resize-none"
          />
        </div>

        {/* Signs & Symptoms */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-signs-symptoms" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Signs & Symptoms
          </Label>
          <Textarea
            id="konsulta-signs-symptoms"
            value={data.signsSymptoms}
            onChange={(e) => handleChange("signsSymptoms", e.target.value)}
            disabled={disabled}
            placeholder="Signs and symptoms observed..."
            rows={2}
            className="text-xs resize-none"
          />
        </div>

        {/* Pain Site */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-pain-site" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Pain Site
          </Label>
          <Input
            id="konsulta-pain-site"
            value={data.painSite}
            onChange={(e) => handleChange("painSite", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Abdomen, Head, Chest..."
            className="h-7 text-xs"
          />
        </div>

        {/* Other Complaint */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-other-complaint" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Other Complaint
          </Label>
          <Input
            id="konsulta-other-complaint"
            value={data.otherComplaint}
            onChange={(e) => handleChange("otherComplaint", e.target.value)}
            disabled={disabled}
            placeholder="Other complaints..."
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
