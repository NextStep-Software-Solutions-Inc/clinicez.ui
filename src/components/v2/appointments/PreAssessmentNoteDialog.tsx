"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { upsertPreAssessmentNoteAction } from "@/actions/appointments/pre-assessment-note.action";
import { MarkdownEditor } from "./MarkdownEditor";
import { usePreAssessmentAI } from "@/hooks/ai/use-pre-assessment-ai";

interface PreAssessmentNoteDialogProps {
  open: boolean;
  appointmentId: number;
  clinicUid: string;
  initialAssessment?: string;
  initialHomeInstructions?: string;
  initialRemarks?: string;
  /** Chief complaint / symptoms pre-filled for AI generation */
  complaint?: string;
  /** Clinic numeric ID for AI usage tracking */
  clinicId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PreAssessmentNoteDialog({
  open,
  appointmentId,
  clinicUid,
  initialAssessment = "",
  initialHomeInstructions = "",
  initialRemarks = "",
  complaint,
  clinicId,
  onClose,
  onSuccess,
}: PreAssessmentNoteDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [assessment, setAssessment] = useState(initialAssessment);
  const [homeInstructions, setHomeInstructions] = useState(initialHomeInstructions);
  const [remarks, setRemarks] = useState(initialRemarks);

  // AI section
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiSymptoms, setAiSymptoms] = useState(complaint ?? "");
  const { generate, isLoading: isGenerating, error: aiError, generatedNotes, reset: resetAI } = usePreAssessmentAI();

  // Sync state when initial values change (e.g. opening for a different appointment)
  useEffect(() => {
    setAssessment(initialAssessment);
    setHomeInstructions(initialHomeInstructions);
    setRemarks(initialRemarks);
    setAiSymptoms(complaint ?? "");
    resetAI();
    setAiExpanded(false);
  }, [initialAssessment, initialHomeInstructions, initialRemarks, complaint, resetAI]);

  const handleGenerate = async () => {
    if (!aiSymptoms.trim()) {
      toast.error("Please enter symptoms or chief complaint to generate notes.");
      return;
    }
    await generate(aiSymptoms, undefined, undefined, clinicId, undefined, 'markdown');
  };

  const handleApplyAI = () => {
    if (!generatedNotes) return;
    setAssessment(generatedNotes.assessment);
    setHomeInstructions(generatedNotes.homeInstructions);
    setRemarks(generatedNotes.remarks);
    resetAI();
    setAiExpanded(false);
    toast.success("AI notes applied. Review and edit before saving.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment.trim()) {
      toast.error("Assessment is required.");
      return;
    }
    if (!remarks.trim()) {
      toast.error("Remarks are required.");
      return;
    }

    setIsPending(true);
    const result = await upsertPreAssessmentNoteAction({
      appointmentId,
      clinicUid,
      assessment,
      homeInstructions: homeInstructions.trim() ? homeInstructions : undefined,
      remarks,
      contentType: 'markdown',
    });
    setIsPending(false);

    if (result.status) {
      toast.success(result.message);
      setAssessment("");
      setHomeInstructions("");
      setRemarks("");
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Pre-Assessment Note
          </SheetTitle>
          <SheetDescription>
            Document findings in markdown. Use **bold**, _italic_, ## headings, - lists.
          </SheetDescription>
        </SheetHeader>

        {/* AI Note Generator */}
        <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800/40">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            onClick={() => setAiExpanded((v) => !v)}
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI Note Generator
            </span>
            {aiExpanded
              ? <ChevronUp className="h-3.5 w-3.5 text-violet-500" />
              : <ChevronDown className="h-3.5 w-3.5 text-violet-500" />
            }
          </button>

          {aiExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-violet-700 dark:text-violet-400">
                  Chief Complaint / Symptoms
                </Label>
                <Textarea
                  value={aiSymptoms}
                  onChange={(e) => setAiSymptoms(e.target.value)}
                  placeholder="Enter the patient's chief complaint or symptoms…"
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <Button
                type="button"
                size="sm"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs"
                disabled={isGenerating || !aiSymptoms.trim()}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Notes
                  </>
                )}
              </Button>

              {aiError && (
                <p className="text-xs text-destructive">{aiError}</p>
              )}

              {generatedNotes && (
                <div className="rounded-lg bg-violet-100/80 dark:bg-violet-900/20 p-3 space-y-2 border border-violet-200/60">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                    ✨ AI-generated preview
                  </p>
                  <div className="text-xs text-muted-foreground max-h-36 overflow-y-auto space-y-1">
                    <p className="font-medium text-foreground/80">Assessment:</p>
                    <p className="whitespace-pre-wrap">{generatedNotes.assessment}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs h-7"
                      onClick={handleApplyAI}
                    >
                      Apply to Form
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-violet-200 text-violet-600 hover:bg-violet-50"
                      onClick={() => resetAI()}
                    >
                      Discard
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/60 italic">
                    ⚠️ AI-generated content. Review and edit before saving.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Assessment <span className="text-destructive">*</span>
            </Label>
            <MarkdownEditor
              value={assessment}
              onChange={setAssessment}
              placeholder={`## Vitals\n- BP: \n- HR: \n- Temp: \n\n## Findings\n`}
              rows={8}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Home Instructions{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <MarkdownEditor
              value={homeInstructions}
              onChange={setHomeInstructions}
              placeholder={`- Rest and hydration\n- Return if symptoms worsen\n`}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Remarks <span className="text-destructive">*</span>
            </Label>
            <MarkdownEditor
              value={remarks}
              onChange={setRemarks}
              placeholder="Additional remarks..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary/90 hover:bg-primary"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
