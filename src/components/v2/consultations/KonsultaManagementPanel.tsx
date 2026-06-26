"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trash2, ClipboardCheck, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getManagementCodesAction,
  getConsultationManagementsAction,
  addConsultationManagementAction,
  updateConsultationManagementRemarksAction,
  removeConsultationManagementAction,
} from "@/actions/consultation/konsulta-management.action";

interface ManagementCode {
  id: string;   // UUID PK
  code: string; // PhilHealth value: "0","1","2","3","4","X"
  description: string;
  sortOrder: number;
}

interface ManagementEntry {
  id: string;
  managementCodeId: string;
  remarks: string | null;
  ManagementCode: ManagementCode;
}

interface KonsultaManagementPanelProps {
  consultationTicketId: number;
  isResolved?: boolean;
}

export default function KonsultaManagementPanel({
  consultationTicketId,
  isResolved = false,
}: KonsultaManagementPanelProps) {
  const [codes, setCodes] = useState<ManagementCode[]>([]);
  const [entries, setEntries] = useState<ManagementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, startAdding] = useTransition();
  const [removing, startRemoving] = useTransition();

  // Track pending remarks for "X" (Others)
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [codesRes, entriesRes] = await Promise.all([
        getManagementCodesAction(),
        getConsultationManagementsAction(consultationTicketId),
      ]);
      if (codesRes.data) setCodes(codesRes.data as ManagementCode[]);
      if (entriesRes.data) setEntries(entriesRes.data as ManagementEntry[]);
      setLoading(false);
    })();
  }, [consultationTicketId]);

  const isSelected = (codeId: string) =>
    entries.some((e) => e.managementCodeId === codeId);

  const handleToggle = (codeId: string, checked: boolean) => {
    if (checked) {
      startAdding(async () => {
        const remarks = remarksMap[codeId] || undefined;
        const res = await addConsultationManagementAction(
          consultationTicketId,
          codeId,
          remarks
        );
        if (res.data) {
          setEntries((prev) => [...prev.filter((e) => e.managementCodeId !== codeId), res.data as unknown as ManagementEntry]);
          toast.success("Management added");
        }
      });
    } else {
      const entry = entries.find((e) => e.managementCodeId === codeId);
      if (!entry) return;
      startRemoving(async () => {
        await removeConsultationManagementAction(entry.id);
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
        toast.success("Management removed");
      });
    }
  };

  const handleRemarksBlur = (codeId: string) => {
    const entry = entries.find((e) => e.managementCodeId === codeId);
    if (!entry) return;
    const remarks = remarksMap[codeId] ?? entry.remarks ?? "";
    startAdding(async () => {
      const res = await updateConsultationManagementRemarksAction(entry.id, remarks);
      if (res.data) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? (res.data as ManagementEntry) : e))
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading management codes...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        PhilHealth Management Plan
        <Badge variant="outline" className="ml-1 text-[10px] h-4">
          {entries.length} selected
        </Badge>
        {(adding || removing) && (
          <Loader2 className="h-3 w-3 animate-spin ml-auto" />
        )}
      </div>

      {/* Code checklist */}
      <div className="rounded-lg border border-teal-200 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 p-3 space-y-2.5">
        {codes.map((code) => {
          const selected = isSelected(code.id);
          const entry = entries.find((e) => e.managementCodeId === code.id);

          return (
            <div key={code.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`mgmt-${consultationTicketId}-${code.id}`}
                  checked={selected}
                  disabled={isResolved || adding || removing}
                  onCheckedChange={(checked) => handleToggle(code.id, !!checked)}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`mgmt-${consultationTicketId}-${code.id}`}
                  className="text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="font-mono text-[10px] bg-muted px-1 rounded">
                    {code.code}
                  </span>
                  {code.description}
                </Label>
              </div>
              {/* Remarks field for selected entries (especially "Others") */}
              {selected && (code.code === "X" || entry?.remarks) && (
                <div className="ml-6">
                  <Input
                    value={remarksMap[code.id] ?? entry?.remarks ?? ""}
                    onChange={(e) =>
                      setRemarksMap((prev) => ({ ...prev, [code.id]: e.target.value }))
                    }
                    onBlur={() => handleRemarksBlur(code.id)}
                    disabled={isResolved}
                    placeholder={code.code === "X" ? "Specify other management..." : "Optional remarks"}
                    className="h-6 text-[10px] px-2"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary of selected */}
      {entries.length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-2">
          <ClipboardCheck className="h-4 w-4 mx-auto mb-1 opacity-30" />
          No management plan selected. Check at least one.
        </div>
      )}
    </div>
  );
}
