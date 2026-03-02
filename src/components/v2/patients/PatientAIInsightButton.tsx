"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Markdown from "react-markdown";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import { getOrGeneratePatientInsightAction } from "@/actions/ai/patient-insight.action";

interface PatientAIInsightButtonProps {
  /** Prisma User.id of the patient */
  patientId: number;
  /** Optional clinic ID to scope the insight */
  clinicId?: number;
  /** Full name of the patient – used in dialog title */
  patientName: string;
  /** Button size variant */
  size?: "sm" | "default";
  /** Extra class names for the button */
  className?: string;
}

/**
 * A button that opens an AI-generated patient insight dialog.
 * Caches insights in the DB for up to 24 hours.
 * Only intended for healthcare provider views.
 */
export function PatientAIInsightButton({
  patientId,
  clinicId,
  patientName,
  size = "sm",
  className,
}: PatientAIInsightButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [insight, setInsight] = useState<{
    content: string;
    validUntil: Date;
    createdAt: Date;
    isFromCache: boolean;
  } | null>(null);

  const fetchInsight = (forceRegen = false) => {
    startTransition(async () => {
      const result = await getOrGeneratePatientInsightAction(
        patientId,
        clinicId,
        forceRegen,
      );
      if (result.status) {
        setInsight(result.data);
      } else {
        toast.error(result.message ?? "Failed to generate AI insight");
      }
    });
  };

  const handleOpen = () => {
    setOpen(true);
    if (!insight) {
      fetchInsight(false);
    }
  };

  const handleRegenerate = () => {
    fetchInsight(true);
  };

  const validUntilDate = insight ? new Date(insight.validUntil) : null;
  const createdAtDate = insight ? new Date(insight.createdAt) : null;
  const isExpiredSoon =
    validUntilDate && validUntilDate.getTime() - Date.now() < 2 * 60 * 60 * 1000;

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={handleOpen}
        title="AI Patient Insight"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        AI Insight
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Patient Insight
            </DialogTitle>
            <DialogDescription>
              AI-generated clinical insight for{" "}
              <span className="font-medium text-foreground">{patientName}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {isPending ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {insight ? "Regenerating insight…" : "Generating AI insight…"}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Analyzing patient data – this may take a few seconds
                </p>
              </div>
            ) : insight ? (
              <>
                {/* Validity / cache info bar */}
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                    isExpiredSoon
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {insight.isFromCache ? "Cached insight" : "Freshly generated"} ·
                    Generated {dayjs(createdAtDate).fromNow()} ·
                    Valid until {dayjs(validUntilDate).format("MMM D, YYYY h:mm A")}
                  </span>
                </div>

                {/* Insight content */}
                <div className="prose dark:prose-invert max-w-none text-sm">
                  <Markdown>{insight.content}</Markdown>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">
                  No insight available. Click Regenerate to generate one.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {!isPending && (
            <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                For healthcare provider use only. Not a substitute for clinical judgment.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isPending}
                className="shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
