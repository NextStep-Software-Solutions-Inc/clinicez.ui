"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Plus, X, Search, FileDown, FlaskConical, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import dayjs from "@/lib/day-utils";
import {
  createDiagnosticRequestAction,
  getDiagnosticRequestsByConsultationAction,
  archiveDiagnosticRequestAction,
} from "@/actions/clinics/clinical-record/diagnostic-requests.action";
import { getDiagnosticProcedures } from "@/actions/clinics/clinical-record/diagnostic-procedures.action";
import DownloadDiagnosticRequestAction from "./DownloadDiagnosticRequestAction";

type DiagnosticProcedureItem = {
  id: string;
  name: string;
  category: string;
  isPhilHealth: boolean;
  philhealthDiagnosticId?: string | null;
};

type DiagnosticRequestRecord = {
  id: string;
  dateRequested: Date;
  remarks: string | null;
  diagnosticProcedures: any;
  HealthCareProvider?: {
    User?: { firstName: string | null; lastName: string | null };
    HPProfile?: { title: string | null; name: string | null };
  };
};

export default function KonsultaDiagnosticRequests({
  clinicUid,
  hpId,
  patientId,
  consultationTicketId,
  recommendedOptions = [],
  onDone,
}: {
  clinicUid: string;
  hpId: number;
  patientId: number;
  consultationTicketId: number;
  recommendedOptions?: { philhealthDiagnosticId: string; status: 'RQ' | 'RF' | 'XX' }[];
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState<DiagnosticRequestRecord[]>([]);
  const [allProcedures, setAllProcedures] = useState<DiagnosticProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProcedures, setSelectedProcedures] = useState<{ id: string; name: string; bodyPart?: string }[]>([]);
  const [remarks, setRemarks] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, procRes] = await Promise.all([
        getDiagnosticRequestsByConsultationAction(consultationTicketId),
        getDiagnosticProcedures(),
      ]);

      if (reqRes.status && reqRes.data) {
        setRequests(reqRes.data as any);
      }
      if (procRes.data) {
        setAllProcedures(procRes.data as any);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load diagnostic data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [consultationTicketId]);

  const filteredProcedures = allProcedures
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 15); // Show top 15 results

  const handleSelectProcedure = (proc: DiagnosticProcedureItem) => {
    if (!selectedProcedures.find((p) => p.id === proc.id)) {
      setSelectedProcedures((prev) => [...prev, { id: proc.id, name: proc.name }]);
    }
  };

  const handleRemoveProcedure = (id: string) => {
    setSelectedProcedures((prev) => prev.filter((p) => p.id !== id));
  };

  const handleBodyPartChange = (id: string, val: string) => {
    setSelectedProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, bodyPart: val } : p))
    );
  };

  const handleSubmit = () => {
    if (selectedProcedures.length === 0) {
      toast.error("Please select at least one procedure.");
      return;
    }

    startTransition(async () => {
      const payload = {
        clinicUid,
        hpId,
        patientId,
        consultationTicketId,
        remarks: remarks || undefined,
        diagnosticProcedures: selectedProcedures.map((p) => ({
          diagnosticProcedureId: p.id,
          bodyPart: p.bodyPart || undefined,
        })),
      };

      const result = await createDiagnosticRequestAction(payload);
      if (result.status) {
        toast.success("Diagnostic request created successfully.");
        setIsAdding(false);
        setSearch("");
        setSelectedProcedures([]);
        setRemarks("");
        loadData();
        if (onDone) onDone();
      } else {
        toast.error(result.message || "Failed to create request.");
      }
    });
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    startTransition(async () => {
      const result = await archiveDiagnosticRequestAction(id);
      if (result.status) {
        toast.success("Request deleted successfully.");
        loadData();
      } else {
        toast.error(result.message || "Failed to delete request.");
      }
    });
  };

  // Compute unrequested RQs
  const requestedPhilhealthIds = new Set<string>();
  requests.forEach(req => {
    if (Array.isArray(req.diagnosticProcedures)) {
      req.diagnosticProcedures.forEach((p: any) => {
        const procInfo = allProcedures.find(ap => ap.id === p.diagnosticProcedureId);
        if (procInfo?.philhealthDiagnosticId) {
          requestedPhilhealthIds.add(procInfo.philhealthDiagnosticId);
        }
      });
    }
  });

  const unrequestedRQs = recommendedOptions
    .filter(opt => opt.status === 'RQ' && !requestedPhilhealthIds.has(opt.philhealthDiagnosticId))
    .map(opt => allProcedures.find(ap => ap.philhealthDiagnosticId === opt.philhealthDiagnosticId))
    .filter(Boolean) as DiagnosticProcedureItem[];

  if (loading) {
    return (
      <div className="p-4 border rounded-md bg-white dark:bg-zinc-950 flex justify-center animate-pulse text-sm text-zinc-500">
        Loading diagnostic requests...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Requests List */}
      <div className="border rounded-md bg-white dark:bg-zinc-950 p-4">
        <div className="flex items-center justify-end mb-4">
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)} className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Request
            </Button>
          )}
        </div>

        {requests.length === 0 && !isAdding && (
          <div className="text-center py-6 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-md">
            No diagnostic requests found.
          </div>
        )}

        {requests.length > 0 && !isAdding && (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="border rounded-md p-3 text-sm bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    Requested on {dayjs(req.dateRequested).format("MMM D, YYYY h:mm A")}
                  </div>
                  {req.HealthCareProvider && (
                    <div className="text-xs text-zinc-500 mt-1">
                      By: {req.HealthCareProvider.HPProfile?.title || ""} {req.HealthCareProvider.HPProfile?.name || `${req.HealthCareProvider.User?.firstName} ${req.HealthCareProvider.User?.lastName}`}
                    </div>
                  )}
                  {req.remarks && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
                      <span className="font-medium">Remarks:</span> {req.remarks}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.isArray(req.diagnosticProcedures) && req.diagnosticProcedures.map((p: any, idx: number) => {
                      const procInfo = allProcedures.find(ap => ap.id === p.diagnosticProcedureId);
                      return (
                        <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary border border-primary/20">
                          {procInfo?.name || "Unknown Procedure"}
                          {p.bodyPart && <span className="ml-1 text-zinc-500">({p.bodyPart})</span>}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DownloadDiagnosticRequestAction request={{ id: req.id }}>
                    <Button type="submit" size="icon" variant="outline" className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10">
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </DownloadDiagnosticRequestAction>
                  <Button size="icon" variant="outline" className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleArchive(req.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Request Form */}
      {isAdding && (
        <div className="border rounded-md bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              New Diagnostic Request
            </h4>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {unrequestedRQs.length > 0 && (
            <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-teal-800 dark:text-teal-400">
                <p className="font-medium flex items-center gap-1"><Stethoscope className="w-4 h-4" /> Recommended Services Pending</p>
                <p className="text-xs mt-1">There are {unrequestedRQs.length} recommended service(s) marked as Requested (RQ) that haven't been added yet.</p>
              </div>
              <Button 
                size="sm" 
                className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                onClick={() => {
                  const newSelected = [...selectedProcedures];
                  unrequestedRQs.forEach(proc => {
                    if (!newSelected.find(p => p.id === proc.id)) {
                      newSelected.push({ id: proc.id, name: proc.name });
                    }
                  });
                  setSelectedProcedures(newSelected);
                }}
              >
                Add RQs to Request
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Search and Results */}
            <div className="space-y-6">
              <Label className="text-xs">Search Procedures</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Chest X-Ray, CBC..."
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {search && filteredProcedures.length > 0 && (
                <div className="border rounded-md bg-white dark:bg-zinc-950 overflow-hidden max-h-48 overflow-y-auto divide-y">
                  {filteredProcedures.map((proc) => (
                    <button
                      key={proc.id}
                      onClick={() => handleSelectProcedure(proc)}
                      className="w-full text-left p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-1"
                    >
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{proc.name}</span>
                      <span className="text-xs text-zinc-500">{proc.category} {proc.isPhilHealth ? "• PhilHealth" : ""}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Selected Procedures & Remarks */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Selected Procedures</Label>
                {selectedProcedures.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic p-3 border border-dashed rounded-md text-center">
                    No procedures selected yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedProcedures.map((p) => (
                      <div key={p.id} className="p-2 border rounded-md bg-white dark:bg-zinc-950 text-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{p.name}</span>
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-zinc-400 hover:text-destructive" onClick={() => handleRemoveProcedure(p.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Optional: Body Part / Notes"
                          value={p.bodyPart || ""}
                          onChange={(e) => handleBodyPartChange(p.id, e.target.value)}
                          className="h-7 text-xs bg-zinc-50 dark:bg-zinc-900 border-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">General Remarks / Clinical Impression</Label>
                <Textarea
                  placeholder="Provide clinical indication or impression..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="min-h-16 text-xs resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t mt-4">
            <Button size="sm" onClick={handleSubmit} disabled={isPending || selectedProcedures.length === 0}>
              {isPending ? "Creating Request..." : "Create Request"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
