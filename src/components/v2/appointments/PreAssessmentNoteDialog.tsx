"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { upsertPreAssessmentNoteAction } from "@/actions/appointments/pre-assessment-note.action";

interface PreAssessmentNoteDialogProps {
  open: boolean;
  appointmentId: number;
  clinicUid: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PreAssessmentNoteDialog({
  open,
  appointmentId,
  clinicUid,
  onClose,
  onSuccess,
}: PreAssessmentNoteDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [assessment, setAssessment] = useState("");
  const [homeInstructions, setHomeInstructions] = useState("");
  const [remarks, setRemarks] = useState("");

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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Pre-Assessment Note
          </DialogTitle>
          <DialogDescription>
            Document the pre-assessment for this appointment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assessment" className="text-xs font-medium">
              Assessment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="assessment"
              placeholder="Enter assessment findings..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="homeInstructions" className="text-xs font-medium">
              Home Instructions{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="homeInstructions"
              placeholder="Enter home care instructions..."
              value={homeInstructions}
              onChange={(e) => setHomeInstructions(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks" className="text-xs font-medium">
              Remarks <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="remarks"
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="resize-none"
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
      </DialogContent>
    </Dialog>
  );
}
