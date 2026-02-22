"use client";

import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { upsertPreAssessmentNoteAction } from "@/actions/appointments/pre-assessment-note.action";
import { MarkdownEditor } from "./MarkdownEditor";

interface PreAssessmentNoteDialogProps {
  open: boolean;
  appointmentId: number;
  clinicUid: string;
  initialAssessment?: string;
  initialHomeInstructions?: string;
  initialRemarks?: string;
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
  onClose,
  onSuccess,
}: PreAssessmentNoteDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [assessment, setAssessment] = useState(initialAssessment);
  const [homeInstructions, setHomeInstructions] = useState(initialHomeInstructions);
  const [remarks, setRemarks] = useState(initialRemarks);

  // Sync state when initial values change (e.g. opening for a different appointment)
  useEffect(() => {
    setAssessment(initialAssessment);
    setHomeInstructions(initialHomeInstructions);
    setRemarks(initialRemarks);
  }, [initialAssessment, initialHomeInstructions, initialRemarks]);

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
