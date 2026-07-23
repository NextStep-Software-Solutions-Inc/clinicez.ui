"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { History, Check, Loader2, DollarSign, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [confirmPaidId, setConfirmPaidId] = useState<string | null>(null);
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

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleTogglePaid = (id: string) => {
    startTransition(async () => {
      const result = await toggleBatchPaidAction(id);
      if (result.status) {
        toast.success("Payment status updated");
        loadHistory();
      }
      setConfirmPaidId(null);
    });
  };

  const parseSubmissionResult = (resultStr: string | null) => {
    if (!resultStr) return null;
    try {
      const parsed = JSON.parse(resultStr);
      const isSuccess = parsed?.success === true || parsed?.success === "true";
      const message = parsed?.message as string;
      const summary = parsed?.summary as { passed?: string, failed?: string, details?: any[] };
      
      let rawUploadResult = (parsed?.uploadxmlresult) || (parsed?.uploadXmlResult) || (parsed?.UPLOADXMLRESULT);
      let otherProperties: Record<string, string | number | boolean | null> = {};
      let errorArray: string[] = [];
      
      if (rawUploadResult && typeof rawUploadResult === "object") {
        const resultObj = rawUploadResult as any;
        if (Array.isArray(resultObj.errors)) {
          errorArray = resultObj.errors;
        } else if (typeof resultObj.errors === "string") {
            try {
              const firstParse = JSON.parse(resultObj.errors);
              if (firstParse.errors && typeof firstParse.errors === "string") {
                  const secondParse = JSON.parse(firstParse.errors);
                  errorArray = secondParse.errors || [secondParse];
              } else if (Array.isArray(firstParse.errors)) {
                  errorArray = firstParse.errors;
              } else {
                  errorArray = [firstParse];
              }
            } catch {
              // ignore
            }
        }
        
        if ("transactionno" in resultObj) otherProperties["Transaction No"] = resultObj.transactionno;
        if ("userid" in resultObj) otherProperties["User ID"] = resultObj.userid;
        if ("dateuploaded" in resultObj) otherProperties["Date Uploaded"] = resultObj.dateuploaded;

        for (const [k, v] of Object.entries(resultObj)) {
          if (k !== "errors" && k !== "transactionno" && k !== "userid" && k !== "dateuploaded" && typeof v !== "object") {
            otherProperties[k] = v as any;
          }
        }
      }
      
      return { isSuccess, message, summary, otherProperties, errorArray, raw: resultStr };
    } catch {
      return null;
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Report Submission History</h2>
        <p className="text-sm text-muted-foreground">Track all submitted PhilHealth Yakap reports</p>
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
          <div className="grid grid-cols-[160px_1fr_80px_180px_100px_120px_60px] gap-3 p-3 bg-muted/30 text-xs font-medium text-muted-foreground border-b">
            <span>Title</span>
            <span>Submission Details</span>
            <span>Tagging</span>
            <span>Transmittal No</span>
            <span>Patients</span>
            <span>Submitted</span>
            <span>Paid</span>
          </div>
          {submissions.map((sub) => {
            const parsed = parseSubmissionResult(sub.submissionResult);
            return (
              <div
                key={sub.id}
                className="grid grid-cols-[160px_1fr_80px_180px_100px_120px_60px] gap-3 p-3 border-b last:border-b-0 items-center hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => setSelectedSubmission(sub)}
              >
                <span className="text-sm font-medium truncate">{sub.title}</span>
                
                <div className="flex flex-col gap-1 text-[11px] min-w-0 pr-4">
                  {parsed ? (
                    <div className="flex items-center gap-2 truncate">
                      {parsed.isSuccess ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400 py-0 text-[10px]"><Check className="h-2.5 w-2.5 mr-0.5" /> Success</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 py-0 text-[10px]">Failed</Badge>
                      )}
                      
                      {parsed.isSuccess ? (
                        <span className="text-muted-foreground truncate flex items-center gap-1">
                          Tx: <span className="font-mono text-emerald-600 dark:text-emerald-400">{parsed.otherProperties["Transaction No"] ?? "—"}</span>
                          {parsed.otherProperties["Transaction No"] && (
                            <button 
                              onClick={(e) => handleCopy(String(parsed.otherProperties["Transaction No"]), e)}
                              className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {parsed.summary && <span className="ml-1 opacity-70">(Passed: {parsed.summary.passed})</span>}
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium truncate">
                          {parsed.errorArray.length > 0 ? `${parsed.errorArray.length} Error(s)` : parsed.message}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground opacity-50 italic">Pending...</span>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] w-fit">Tag {sub.tagging}</Badge>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-teal-600 dark:text-teal-400">{sub.transmittalNo}</span>
                  {sub.transmittalNo && (
                    <button 
                      onClick={(e) => handleCopy(sub.transmittalNo as string, e)}
                      className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <span className="text-xs">{sub._count?.BatchPatients ?? 0}</span>
              <span className="text-xs text-muted-foreground">
                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—"}
              </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={sub.isPaid}
                    onCheckedChange={() => setConfirmPaidId(sub.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Paid Status */}
      <AlertDialog open={!!confirmPaidId} onOpenChange={(open) => !open && setConfirmPaidId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const sub = submissions.find(s => s.id === confirmPaidId);
                if (!sub) return "Are you sure you want to change the payment status?";
                return `Are you sure you want to mark "${sub.title}" as ${sub.isPaid ? 'UNPAID' : 'PAID'}?`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmPaidId && handleTogglePaid(confirmPaidId)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Tag {selectedSubmission?.tagging}</Badge>
              {(() => {
                const parsed = parseSubmissionResult(selectedSubmission?.submissionResult ?? null);
                if (!parsed) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">Submitted</Badge>;
                return parsed.isSuccess 
                  ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"><Check className="h-3 w-3 mr-1" /> Success</Badge>
                  : <Badge variant="destructive">Failed</Badge>;
              })()}
              {selectedSubmission?.isPaid && (
                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                  <DollarSign className="h-3 w-3 mr-1" /> Paid
                </Badge>
              )}
            </div>
            {selectedSubmission?.transmittalNo && (
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-mono">Transmittal: {selectedSubmission.transmittalNo}</p>
                <button 
                  onClick={(e) => handleCopy(selectedSubmission.transmittalNo as string, e)}
                  className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {/* Parsed Submission Details */}
            {(() => {
              const parsed = parseSubmissionResult(selectedSubmission?.submissionResult ?? null);
              if (!parsed) return null;
              
              return (
                <div className="space-y-4">
                  {/* Message */}
                  {parsed.message && (
                    <div className={`text-xs font-medium p-2 rounded border ${parsed.isSuccess ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400" : "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400"}`}>
                      {parsed.message}
                    </div>
                  )}

                  {/* Summary */}
                  {parsed.summary && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="border rounded-lg p-2 bg-muted/30">
                        <span className="block text-muted-foreground mb-1 uppercase text-[10px] font-semibold">Passed</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{parsed.summary.passed ?? 0}</span>
                      </div>
                      <div className="border rounded-lg p-2 bg-muted/30">
                        <span className="block text-muted-foreground mb-1 uppercase text-[10px] font-semibold">Failed</span>
                        <span className="font-mono text-red-600 dark:text-red-400 font-medium">{parsed.summary.failed ?? 0}</span>
                      </div>
                    </div>
                  )}

                <div className="border rounded-lg p-3 bg-muted/20">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Upload Details</p>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    {Object.entries(parsed.otherProperties).map(([k, v]) => (
                      <div key={k} className="flex flex-col">
                        <span className="font-semibold opacity-70 mb-0.5 uppercase">{k}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded w-fit text-muted-foreground">
                            {v === null || v === undefined ? "null" : String(v)}
                          </span>
                          {v !== null && v !== undefined && (
                            <button 
                              onClick={(e) => handleCopy(String(v), e)}
                              className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                  {/* Errors */}
                  {parsed.errorArray.length > 0 && (
                    <div className="border border-red-200 bg-red-50/30 rounded-lg p-3 dark:border-red-900/50 dark:bg-red-950/10">
                      <p className="text-[10px] uppercase font-semibold text-red-800 dark:text-red-300 mb-2">Upload Errors</p>
                      <ul className="space-y-1.5">
                        {parsed.errorArray.map((err, idx) => (
                          <li key={idx} className="text-[11px] text-red-800 dark:text-red-300 flex items-start gap-1.5 font-medium">
                            <span className="mt-0.5">•</span>
                            <span>{err.replace(/^an error was encountered while inserting .*? -error- /i, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
            
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
