"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Plus,
  FileText,
  Check,
  Send,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
  AlertCircle,
  Copy,
  Download,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  getBatchReportsAction,
  getBatchReportDetailAction,
  createBatchReportAction,
  updateBatchPatientsAction,
  generateBatchXmlAction,
  validateBatchReportAction,
  submitBatchReportAction,
  regenerateBatchXmlAction,
  deleteBatchReportAction,
  downloadEncryptedBatchXmlAction,
  unsubmitBatchReportAction,
} from "@/actions/philhealth-yakap.actions";

interface PhilHealthBatchReportsProps {
  clinicUid: string;
}

type BatchReport = {
  id: string;
  title: string;
  tagging: string;
  transmittalNo: string | null;
  status: string;
  isPaid: boolean;
  createdAt: Date;
  validatedAt: Date | null;
  submittedAt: Date | null;
  _count?: { BatchPatients: number };
};

type BatchDetail = BatchReport & {
  xmlPayload: string | null;
  validationResult: string | null;
  submissionResult: string | null;
  BatchPatients: {
    id: string;
    clinicPatientId: number;
    tagging: string;
    isSelected: boolean;
    selectedTicketIds: number[];
    ClinicPatient: {
      id: number;
      Patient: {
        firstName: string | null;
        lastName: string | null;
        middleName: string | null;
        dob: Date | null;
        gender: string | null;
      };
      PhilHealthKonsultaEnlistments: {
        id: number;
        year: number;
        hciCaseNo: string;
        enlistmentTransNo: string;
        profilingTransNo: string | null;
      }[];
      ConsultationTickets: {
        id: number;
        subject: string | null;
        soapTransNo: string | null;
        createdAt: Date;
        ConsultationTicketAttribute: { status: string } | null;
      }[];
    };
  }[];
};

export default function PhilHealthBatchReports({ clinicUid }: PhilHealthBatchReportsProps) {
  const [batches, setBatches] = useState<BatchReport[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTagging, setNewTagging] = useState<string>("1");
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const loadBatches = useCallback(() => {
    startTransition(async () => {
      const result = await getBatchReportsAction(clinicUid);
      if (result.status && result.data) {
        setBatches(result.data as unknown as BatchReport[]);
      }
    });
  }, [clinicUid]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const loadBatchDetail = useCallback((batchId: string) => {
    startTransition(async () => {
      const result = await getBatchReportDetailAction(clinicUid, batchId);
      if (result.status && result.data) {
        setSelectedBatch(result.data as unknown as BatchDetail);
      }
    });
  }, [clinicUid]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    setLoadingAction("create");
    startTransition(async () => {
      const result = await createBatchReportAction(clinicUid, newTitle, newTagging);
      if (result.status) {
        toast.success("Batch created successfully");
        setIsCreateOpen(false);
        setNewTitle("");
        loadBatches();
        if (result.data) {
          loadBatchDetail((result.data as { id: string }).id);
        }
      } else {
        toast.error(result.message || "Failed to create batch");
      }
      setLoadingAction(null);
    });
  };

  const handleTogglePatient = (batchPatientId: string, isSelected: boolean) => {
    if (!selectedBatch || selectedBatch.status === "SUBMITTED") return;
    startTransition(async () => {
      await updateBatchPatientsAction(selectedBatch.id, [{
        batchPatientId,
        isSelected,
      }]);
      loadBatchDetail(selectedBatch.id);
    });
  };

  const handleToggleConsultation = (batchPatientId: string, ticketId: number, currentIds: number[]) => {
    if (!selectedBatch || selectedBatch.status === "SUBMITTED") return;
    const newIds = currentIds.includes(ticketId)
      ? currentIds.filter(id => id !== ticketId)
      : [...currentIds, ticketId];
    startTransition(async () => {
      await updateBatchPatientsAction(selectedBatch.id, [{
        batchPatientId,
        selectedTicketIds: newIds,
      }]);
      loadBatchDetail(selectedBatch.id);
    });
  };

  const handleGenerateXml = () => {
    if (!selectedBatch) return;
    setLoadingAction("generate");
    startTransition(async () => {
      const result = await generateBatchXmlAction(clinicUid, selectedBatch.id);
      if (result.status) {
        toast.success("XML generated successfully");
        loadBatchDetail(selectedBatch.id);
        loadBatches();
      } else {
        toast.error(result.message || "Failed to generate XML");
      }
      setLoadingAction(null);
    });
  };

  const handleValidate = () => {
    if (!selectedBatch) return;
    setLoadingAction("validate");
    startTransition(async () => {
      const result = await validateBatchReportAction(clinicUid, selectedBatch.id);
      if (result.status) {
        toast.success("XML validated successfully");
      } else {
        toast.error(result.message || "Validation failed");
      }
      // Always reload to show validation result in detail view
      loadBatchDetail(selectedBatch.id);
      loadBatches();
      setLoadingAction(null);
    });
  };

  const handleSubmit = () => {
    if (!selectedBatch) return;
    setLoadingAction("submit");
    startTransition(async () => {
      const result = await submitBatchReportAction(clinicUid, selectedBatch.id);
      if (result.status) {
        // Look at the API success response, since status=true just means the request completed
        const apiSuccess = result.data?.success === true || result.data?.success === "true" || result.data?.success === "True";
        if (apiSuccess) {
          toast.success("Report submitted successfully");
        } else {
          toast.error("Submission failed, please check the results below");
        }
        loadBatchDetail(selectedBatch.id);
        loadBatches();
      } else {
        toast.error(result.message || "Submission failed");
      }
      setLoadingAction(null);
    });
  };

  const handleRegenerate = () => {
    if (!selectedBatch) return;
    setLoadingAction("regenerate");
    startTransition(async () => {
      const result = await regenerateBatchXmlAction(clinicUid, selectedBatch.id);
      if (result.status) {
        toast.success("XML regenerated — validation cleared");
        loadBatchDetail(selectedBatch.id);
        loadBatches();
      } else {
        toast.error(result.message || "Failed to regenerate XML");
      }
      setLoadingAction(null);
    });
  };

  const handleUnsubmit = () => {
    if (!selectedBatch) return;
    setLoadingAction("unsubmit");
    startTransition(async () => {
      const result = await unsubmitBatchReportAction(clinicUid, selectedBatch.id);
      if (result.status) {
        toast.success("Batch unsubmitted — status reset to DRAFT for testing");
        loadBatchDetail(selectedBatch.id);
        loadBatches();
      } else {
        toast.error(result.message || "Failed to unsubmit batch");
      }
      setLoadingAction(null);
    });
  };

  const handleDelete = () => {
    if (!selectedBatch) return;
    setLoadingAction("delete");
    startTransition(async () => {
      const result = await deleteBatchReportAction(clinicUid, selectedBatch.id);
      if (result.status) {
        toast.success("Batch deleted");
        setSelectedBatch(null);
        loadBatches();
      } else {
        toast.error(result.message || "Failed to delete batch");
      }
      setLoadingAction(null);
    });
  };

  const selectedCount = selectedBatch?.BatchPatients?.filter(bp => bp.isSelected).length ?? 0;
  const isReadOnly = selectedBatch?.status === "SUBMITTED";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">Draft</Badge>;
      case "VALIDATED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">Validated</Badge>;
      case "SUBMITTED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Batch List View
  if (!selectedBatch) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Batch Reports</h2>
            <p className="text-sm text-muted-foreground">Create and manage PhilHealth Yakap reports</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md">
                <Plus className="h-4 w-4" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Batch Report</DialogTitle>
                <DialogDescription>Create a batch for PhilHealth Yakap XML report generation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. FPE Report - June 2026"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Report Tagging</Label>
                  <Select value={newTagging} onValueChange={setNewTagging}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tagging 1 — First Patient Encounter (FPE) Report</SelectItem>
                      <SelectItem value="2">Tagging 2 — FPE + Consultation Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newTitle.trim() || loadingAction === "create"}>
                  {loadingAction === "create" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {batches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No batch reports yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {batches.map((batch) => (
              <Card
                key={batch.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-border/60"
                onClick={() => loadBatchDetail(batch.id)}
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-950/40">
                      <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{batch.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          Tagging {batch.tagging} • {batch._count?.BatchPatients ?? 0} patients
                        </span>
                        {batch.transmittalNo && (
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {batch.transmittalNo}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(batch.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Batch Detail View
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBatch(null)}>
            ← Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{selectedBatch.title}</h2>
              {getStatusBadge(selectedBatch.status)}
              <Badge variant="outline" className="text-xs">Tagging {selectedBatch.tagging}</Badge>
            </div>
            {selectedBatch.transmittalNo && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs font-mono text-muted-foreground">
                  Transmittal: {selectedBatch.transmittalNo}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedBatch.transmittalNo || "");
                    toast.success("Transmittal number copied");
                  }}
                  className="p-0.5 rounded hover:bg-muted transition-colors"
                  title="Copy transmittal number"
                >
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isReadOnly && selectedBatch.status === "DRAFT" && !selectedBatch.xmlPayload && (
            <Button onClick={handleGenerateXml} disabled={selectedCount === 0 || !!loadingAction} className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600">
              {loadingAction === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate XML for {selectedCount} Selected
            </Button>
          )}

          {!isReadOnly && selectedBatch.status === "DRAFT" && selectedBatch.xmlPayload && (
            <>
              <Button variant="outline" onClick={handleRegenerate} disabled={!!loadingAction} className="gap-2">
                {loadingAction === "regenerate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate XML
              </Button>
              <Button onClick={handleValidate} disabled={!!loadingAction} className="gap-2 bg-blue-600 hover:bg-blue-700">
                {loadingAction === "validate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Validate XML
              </Button>
            </>
          )}

          {!isReadOnly && selectedBatch.status === "VALIDATED" && (
            <>
              <Button variant="outline" onClick={handleRegenerate} disabled={!!loadingAction} className="gap-2">
                {loadingAction === "regenerate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate XML
              </Button>
              <Button onClick={handleSubmit} disabled={!!loadingAction} className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600">
                {loadingAction === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Report
              </Button>
            </>
          )}

          {selectedBatch.status === "SUBMITTED" && (
            <Button variant="outline" onClick={handleUnsubmit} disabled={!!loadingAction} className="gap-2 text-amber-600 border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20">
              {loadingAction === "unsubmit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Unsubmit (Testing)
            </Button>
          )}

          {!isReadOnly && selectedBatch.status === "DRAFT" && (
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={!!loadingAction} className="text-destructive hover:text-destructive">
              {loadingAction === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Validation / Submission Results */}
      {selectedBatch.validationResult && (() => {
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(selectedBatch.validationResult); } catch { /* noop */ }

        const isSuccess = parsed?.success === true || parsed?.success === "true";
        const message = (parsed?.message as string) || "";

        // Extract decrypted errors
        let errorList: string[] = [];
        let rawDecryptedStr = "";
        
        if (parsed?.decryptedErrors) {
          rawDecryptedStr = typeof parsed.decryptedErrors === "string" ? parsed.decryptedErrors : JSON.stringify(parsed.decryptedErrors);
          
          try {
            // PhilHealth encryption often leaves trailing padding/control characters.
            let cleanStr = rawDecryptedStr.replace(/[\x00-\x1F\x7F-\x9F]+$/g, '');
            // Extract the JSON object part
            const firstBrace = cleanStr.indexOf('{');
            const lastBrace = cleanStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
              cleanStr = cleanStr.substring(firstBrace, lastBrace + 1);
            }

            const decryptedObj = JSON.parse(cleanStr);
            if (Array.isArray(decryptedObj?.errors)) {
              errorList = decryptedObj.errors;
            } else if (typeof decryptedObj?.errors === 'string') {
              errorList = [decryptedObj.errors];
            }
          } catch (err) {
            console.error("Failed to parse decrypted errors:", err);
            // Fallback string extraction if JSON parsing completely fails
            const matches = Array.from(rawDecryptedStr.matchAll(/"(Line No\.[^"]+)"/g)).map(m => m[1]);
            if (matches.length > 0) {
              errorList = matches;
            } else {
              // Last resort, split by comma if it looks like an array
              const fallbackMatches = rawDecryptedStr.match(/"([^"]+)"/g);
              if (fallbackMatches) {
                 errorList = fallbackMatches.map(m => m.replace(/(^"|"$)/g, '')).filter(s => s !== "errors");
              }
            }
          }
        }

        // Group errors by line number
        const groupedErrors: Record<string, string[]> = {};
        for (const err of errorList) {
          const match = err.match(/^Line No\. (\d+) : (.+)$/);
          if (match) {
            const lineNo = match[1];
            if (!groupedErrors[lineNo]) groupedErrors[lineNo] = [];
            groupedErrors[lineNo].push(match[2]);
          } else {
            if (!groupedErrors["General"]) groupedErrors["General"] = [];
            groupedErrors["General"].push(err);
          }
        }

        return (
          <Card className={isSuccess
            ? "border-emerald-200 dark:border-emerald-800"
            : "border-red-200 dark:border-red-800"
          }>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <CardTitle className="text-sm">
                  {isSuccess ? "Report Validated Successfully" : "Validation Failed"}
                </CardTitle>
                {errorList.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {errorList.length} issue{errorList.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* Status Message */}
              {message && (
                <p className={`text-xs font-medium ${isSuccess ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                  {message}
                </p>
              )}

              {/* Pretty Error List */}
              {errorList.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(groupedErrors).map(([lineNo, errors]) => (
                    <div key={lineNo} className="rounded-lg border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                          {lineNo === "General" ? "General Issues" : `Line ${lineNo}`}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {errors.length} issue{errors.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {errors.map((err, idx) => (
                          <li key={idx} className="text-[11px] text-red-800 dark:text-red-300 flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5 shrink-0">•</span>
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw String Fallback for Decrypted Errors (if JSON parse failed) */}
              {errorList.length === 0 && rawDecryptedStr && (
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 max-h-80 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap font-mono">
                    {rawDecryptedStr}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Submission Results */}
      {selectedBatch.submissionResult && (() => {
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(selectedBatch.submissionResult); } catch { /* noop */ }
        const isSuccess = parsed?.success === true || parsed?.success === "true";
        const message = (parsed?.message as string) || "Report submitted";
        const summaryResult = parsed?.summary as Record<string, any> | undefined;
        
        let rawUploadResult = (parsed?.uploadxmlresult) ||
                              (parsed?.uploadXmlResult) || 
                              (parsed?.UPLOADXMLRESULT) || 
                              (parsed?.decodedJwtPayload as any)?.UPLOADXMLRESULT || 
                              (parsed?.decodedJwtPayload as any)?.uploadxmlresult ||
                              parsed?.decryptedErrors ||
                              parsed?.decryptedResult ||
                              "";
                              
        // Try to deeply parse stringified JSON in rawUploadResult.errors if it exists
        if (rawUploadResult && typeof rawUploadResult === "object") {
          try {
            if ((rawUploadResult as any).errors && typeof (rawUploadResult as any).errors === "string") {
              const firstParse = JSON.parse((rawUploadResult as any).errors);
              Object.assign(rawUploadResult, firstParse);
              if (firstParse.errors && typeof firstParse.errors === "string") {
                try {
                  const secondParse = JSON.parse(firstParse.errors);
                  (rawUploadResult as any).errors = secondParse.errors || secondParse;
                } catch {
                  // If second parse fails, keep it as firstParse.errors
                }
              }
            }
          } catch (e) {
            // keep it as is
          }
        }
        
        let errorArray: string[] = [];
        let otherProperties: Record<string, string | number | boolean | null> = {};
        
        if (rawUploadResult && typeof rawUploadResult === "object") {
          const resultObj = rawUploadResult as any;
          if (Array.isArray(resultObj.errors)) {
            errorArray = resultObj.errors;
          } else if (typeof resultObj.errors === "string") {
            errorArray = [resultObj.errors];
          }
          
          // Explicitly map the properties the user wants to see
          if ("transactionno" in resultObj) otherProperties["Transaction No"] = resultObj.transactionno;
          if ("userid" in resultObj) otherProperties["User ID"] = resultObj.userid;
          if ("dateuploaded" in resultObj) otherProperties["Date Uploaded"] = resultObj.dateuploaded;
          
          // Gather any other unexpected primitive properties
          for (const [key, value] of Object.entries(resultObj)) {
            if (key !== "errors" && key !== "transactionno" && key !== "userid" && key !== "dateuploaded" && typeof value !== "object") {
              otherProperties[key] = value as string | number | boolean | null;
            }
          }
        }
        
        const fallbackXmlResult = errorArray.length === 0 && Object.keys(otherProperties).length === 0 && rawUploadResult 
          ? (typeof rawUploadResult === "string" ? rawUploadResult : JSON.stringify(rawUploadResult, null, 2))
          : "";

        return (
          <Card className={isSuccess ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"}>
            <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {isSuccess ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                Submission {isSuccess ? "Successful" : "Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <p className={`text-xs font-medium ${isSuccess ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                {message}
              </p>
              
              {/* Human-friendly Upload XML Result */}
              {(errorArray.length > 0 || Object.keys(otherProperties).length > 0) && (
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 max-h-80 overflow-y-auto custom-scrollbar space-y-3">
                  
                  {Object.keys(otherProperties).length > 0 && (
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-red-800 dark:text-red-300">
                      {Object.entries(otherProperties).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                          <span className="font-semibold uppercase opacity-70 mb-0.5">{k}</span>
                          <span className="font-mono bg-red-100/50 dark:bg-red-900/30 px-1.5 py-0.5 rounded w-fit">
                            {v === null || v === undefined ? "null" : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {errorArray.length > 0 && (
                    <div className="pt-2 border-t border-red-200/50 dark:border-red-900/50">
                      <span className="font-semibold uppercase opacity-70 text-[11px] text-red-800 dark:text-red-300 block mb-1.5">Errors</span>
                      <ul className="space-y-1.5">
                        {errorArray.map((err, idx) => (
                          <li key={idx} className="text-[11px] text-red-800 dark:text-red-300 flex items-start gap-1.5 font-medium">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                            <span>{err.replace(/^an error was encountered while inserting .*? -error- /i, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Fallback Raw JSON */}
              {fallbackXmlResult && (
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 max-h-80 overflow-y-auto custom-scrollbar">
                  <p className="text-[11px] text-red-800 dark:text-red-300 font-mono whitespace-pre-wrap">
                    {fallbackXmlResult}
                  </p>
                </div>
              )}

              {/* Summary Result */}
              {summaryResult && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <span className="font-semibold uppercase opacity-70 text-[11px] block mb-2">Summary</span>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="flex flex-col">
                      <span className="opacity-70 mb-0.5">Passed</span>
                      <span className="font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded w-fit">
                        {summaryResult.passed || "0"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-70 mb-0.5">Failed</span>
                      <span className="font-mono bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded w-fit">
                        {summaryResult.failed || "0"}
                      </span>
                    </div>
                  </div>
                  {Array.isArray(summaryResult.details) && summaryResult.details.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="opacity-70 text-[10px] block mb-1">Details</span>
                      <ul className="space-y-1">
                        {summaryResult.details.map((detail: any, idx: number) => (
                          <li key={idx} className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                            {typeof detail === 'object' ? JSON.stringify(detail) : String(detail)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Patient List */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Patients ({selectedBatch.BatchPatients?.length ?? 0})</CardTitle>
          <CardDescription className="text-xs">
            {selectedCount} of {selectedBatch.BatchPatients?.length ?? 0} selected
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-1">
            {selectedBatch.BatchPatients?.map((bp) => {
              const patient = bp.ClinicPatient?.Patient;
              const name = [patient?.firstName, patient?.middleName, patient?.lastName].filter(Boolean).join(" ") || "Unknown";
              const enlistment = bp.ClinicPatient?.PhilHealthKonsultaEnlistments?.[0];
              const consultations = bp.ClinicPatient?.ConsultationTickets?.filter(t => t.soapTransNo) ?? [];

              return (
                <div key={bp.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={bp.isSelected}
                      onCheckedChange={(checked) => handleTogglePatient(bp.id, !!checked)}
                      disabled={isReadOnly}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {enlistment && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Case: {enlistment.hciCaseNo}
                          </span>
                        )}
                        {patient?.dob && (
                          <span className="text-[10px] text-muted-foreground">
                            DOB: {new Date(patient.dob).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tagging 2: Show consultations accordion */}
                  {selectedBatch.tagging === "2" && bp.isSelected && consultations.length > 0 && (
                    <div className="ml-8 mt-2 border-l-2 border-muted pl-3 space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Consultations with SOAP Trans No.
                      </p>
                      {consultations.map((consultation) => (
                        <div key={consultation.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            checked={bp.selectedTicketIds.includes(consultation.id)}
                            onCheckedChange={() => handleToggleConsultation(bp.id, consultation.id, bp.selectedTicketIds)}
                            disabled={isReadOnly}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{consultation.subject || "Consultation"}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                                {consultation.soapTransNo}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(consultation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBatch.tagging === "2" && bp.isSelected && consultations.length === 0 && (
                    <div className="ml-8 mt-2 text-xs text-muted-foreground italic">
                      No consultations with SOAP transaction numbers available.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* XML Preview */}
      {selectedBatch.xmlPayload && (
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Generated XML Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {(selectedBatch.xmlPayload.length / 1024).toFixed(1)} KB
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => {
                  navigator.clipboard.writeText(selectedBatch.xmlPayload || "");
                  toast.success("XML copied to clipboard");
                }}
              >
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                  >
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Download XML</DialogTitle>
                    <DialogDescription>
                      Choose the format you would like to download. Encrypted XML is required for PhilHealth submission.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        const blob = new Blob([selectedBatch.xmlPayload || ""], { type: "application/xml;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        
                        const accreNo = selectedBatch.transmittalNo
                          ? selectedBatch.transmittalNo.substring(1, 10)
                          : "UNKNOWN";
                        const transmittal = selectedBatch.transmittalNo || selectedBatch.title.replace(/\s+/g, "_");
                        
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const dd = String(today.getDate()).padStart(2, '0');
                        const dateStr = `${yyyy}${mm}${dd}`;
                        
                        link.download = `${selectedBatch.tagging}${accreNo}_${dateStr}_${transmittal}.xml`;
                        link.click();
                        URL.revokeObjectURL(url);
                        toast.success("Raw XML file downloaded");
                      }}
                    >
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span>Raw XML</span>
                    </Button>
                    <Button
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                      onClick={async () => {
                        try {
                          const toastId = toast.loading("Encrypting XML payload...");
                          const encryptedStr = await downloadEncryptedBatchXmlAction(clinicUid, selectedBatch.id);
                          
                          const blob = new Blob([encryptedStr], { type: "application/json;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          
                          const accreNo = selectedBatch.transmittalNo
                            ? selectedBatch.transmittalNo.substring(1, 10)
                            : "UNKNOWN";
                          const transmittal = selectedBatch.transmittalNo || selectedBatch.title.replace(/\s+/g, "_");
                          
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const dd = String(today.getDate()).padStart(2, '0');
                          const dateStr = `${yyyy}${mm}${dd}`;
                          
                          link.download = `${selectedBatch.tagging}${accreNo}_${dateStr}_${transmittal}.xml.enc`;
                          link.click();
                          URL.revokeObjectURL(url);
                          toast.success("Encrypted XML file downloaded", { id: toastId });
                        } catch (err: any) {
                          toast.error(err.message || "Failed to download encrypted XML");
                        }
                      }}
                    >
                      <Download className="h-6 w-6" />
                      <span>Encrypted XML</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <pre className="text-[10px] font-mono bg-muted/50 p-3 rounded-lg overflow-auto max-h-[500px] whitespace-pre-wrap">
              {selectedBatch.xmlPayload}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
