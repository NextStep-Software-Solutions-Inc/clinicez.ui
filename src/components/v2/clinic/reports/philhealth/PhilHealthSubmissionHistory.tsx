"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { History, Check, Loader2, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSubmissionHistoryAction, toggleBatchPaidAction } from "@/actions/philhealth-yakap.actions";

interface PhilHealthSubmissionHistoryProps {
  clinicUid: string;
}

type SubmissionRecord = {
  id: string;
  title: string;
  tagging: string;
  transmittalNo: string | null;
  status: string;
  isPaid: boolean;
  submittedAt: Date | null;
  submissionResult: string | null;
  _count?: { BatchPatients: number };
};

export default function PhilHealthSubmissionHistory({ clinicUid }: PhilHealthSubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadHistory = useCallback(() => {
    startTransition(async () => {
      const result = await getSubmissionHistoryAction(clinicUid);
      if (result.status && result.data) {
        setSubmissions(result.data as unknown as SubmissionRecord[]);
      }
    });
  }, [clinicUid]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleTogglePaid = (id: string) => {
    startTransition(async () => {
      const result = await toggleBatchPaidAction(id);
      if (result.status) {
        toast.success("Payment status updated");
        loadHistory();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Report Submission History</h2>
        <p className="text-sm text-muted-foreground">Track all submitted PhilHealth Konsulta reports</p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No submitted reports yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_80px_180px_100px_120px_60px] gap-3 p-3 bg-muted/30 text-xs font-medium text-muted-foreground border-b">
            <span>Title</span>
            <span>Tagging</span>
            <span>Transmittal No</span>
            <span>Patients</span>
            <span>Submitted</span>
            <span>Paid</span>
          </div>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="grid grid-cols-[1fr_80px_180px_100px_120px_60px] gap-3 p-3 border-b last:border-b-0 items-center hover:bg-muted/20 cursor-pointer transition-colors"
              onClick={() => setSelectedSubmission(sub)}
            >
              <span className="text-sm font-medium truncate">{sub.title}</span>
              <Badge variant="outline" className="text-[10px] w-fit">Tag {sub.tagging}</Badge>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400">{sub.transmittalNo}</span>
              <span className="text-xs">{sub._count?.BatchPatients ?? 0}</span>
              <span className="text-xs text-muted-foreground">
                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—"}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={sub.isPaid}
                  onCheckedChange={() => handleTogglePaid(sub.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Tag {selectedSubmission?.tagging}</Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                Submitted
              </Badge>
              {selectedSubmission?.isPaid && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <DollarSign className="h-3 w-3 mr-1" /> Paid
                </Badge>
              )}
            </div>
            {selectedSubmission?.transmittalNo && (
              <p className="text-xs font-mono">Transmittal: {selectedSubmission.transmittalNo}</p>
            )}
            {selectedSubmission?.submissionResult && (
              <div>
                <p className="text-xs font-medium mb-1">Submission Response:</p>
                <pre className="text-[10px] font-mono bg-muted/50 p-3 rounded-lg max-h-48 overflow-auto whitespace-pre-wrap">
                  {selectedSubmission.submissionResult}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
