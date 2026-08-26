"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2, Edit2, Check, X, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  addConsultationDiagnosisAction,
  updateConsultationDiagnosisAction,
  deleteConsultationDiagnosisAction,
} from "@/actions/clinics/clinical-record/consultation-diagnoses.action";
import { searchICD10CodesAction } from "@/actions/super-admin/import-medical-codes.action";
import type { ICD10SearchResult } from "@/actions/super-admin/import-medical-codes.action";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;
type Diagnosis = NonNullable<Detail["ConsultationDiagnoses"]>[number];

const DIAGNOSIS_TYPES = [
  { value: "PRIMARY", label: "Primary" },
  { value: "SECONDARY", label: "Secondary" },
  { value: "COMORBIDITY", label: "Comorbidity" },
  { value: "COMPLICATION", label: "Complication" },
];

const TYPE_COLORS: Record<string, string> = {
  PRIMARY:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SECONDARY:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  COMORBIDITY:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLICATION:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

// ─── ICD-10 autocomplete combobox ─────────────────────────────────────────────

interface ICD10ComboboxProps {
  icd10Code: string;
  description: string;
  onSelect: (result: ICD10SearchResult) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

function ICD10Combobox({
  icd10Code,
  description,
  onSelect,
  onClear,
  placeholder = "Search ICD-10 code or description…",
  className,
}: ICD10ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ICD10SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayValue = icd10Code
    ? description
      ? `${icd10Code} – ${description}`
      : icd10Code
    : "";

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setIsSearching(true);
      searchICD10CodesAction("", 10).then((results) => {
        setSuggestions(results);
        setIsSearching(false);
      });
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchICD10CodesAction(val, 10);
      setSuggestions(results);
      setIsSearching(false);
    }, 250);
  };

  const handleSelect = (result: ICD10SearchResult) => {
    onSelect(result);
    setOpen(false);
    setQuery("");
    setSuggestions([]);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setQuery("");
      setSuggestions([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      searchICD10CodesAction("", 10).then((results) => {
        setSuggestions(results);
        setIsSearching(false);
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-8 text-xs font-normal mt-1",
            className
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              !displayValue && "text-muted-foreground"
            )}
          >
            {displayValue || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {icd10Code && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                className="h-3 w-3 opacity-50 hover:opacity-100 cursor-pointer flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onClear();
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search ICD-10…"
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList>
            {isSearching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isSearching && suggestions.length === 0 && (
              <CommandEmpty>No ICD-10 codes found</CommandEmpty>
            )}
            {!isSearching &&
              suggestions.map((r) => (
                <CommandItem
                  key={r.code}
                  value={r.code}
                  onSelect={() => handleSelect(r)}
                  className="text-xs gap-2"
                >
                  <span className="font-mono font-semibold text-primary shrink-0">
                    {r.code}
                  </span>
                  <span className="truncate">{r.description}</span>
                  {r.category && (
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      {r.category}
                    </span>
                  )}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ConsultationDiagnosesProps {
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
  isResolved?: boolean;
}

interface DiagnosisFormState {
  icd10Code: string;
  description: string;
  type: string;
}

const EMPTY_FORM: DiagnosisFormState = {
  icd10Code: "",
  description: "",
  type: "PRIMARY",
};

export default function ConsultationDiagnoses({
  consultation,
  myHPs,
  onPatchDetail,
  isResolved = false,
}: ConsultationDiagnosesProps) {
  const ticketHpIds = consultation.ConsultationTicketHPs.map(
    (h) => h.HealthCareProvider.id
  );
  const myActiveHp =
    myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DiagnosisFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DiagnosisFormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const diagnoses = consultation.ConsultationDiagnoses ?? [];

  const refreshDiagnoses = (updated: Diagnosis[]) => {
    onPatchDetail({ ConsultationDiagnoses: updated });
  };

  const handleAdd = () => {
    if (!form.icd10Code.trim()) {
      toast.error("ICD-10 code is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!myActiveHp) {
      toast.error("No healthcare provider assigned to this consultation");
      return;
    }

    startTransition(async () => {
      const result = await addConsultationDiagnosisAction({
        consultationTicketId: consultation.id,
        icd10Code: form.icd10Code.trim(),
        description: form.description.trim(),
        type: form.type,
        hpId: myActiveHp.id,
      });

      if (result.status && result.data) {
        refreshDiagnoses([...diagnoses, result.data]);
        setForm(EMPTY_FORM);
        setShowForm(false);
        toast.success("Diagnosis added");
      } else {
        toast.error(result.message ?? "Failed to add diagnosis");
      }
    });
  };

  const handleStartEdit = (diagnosis: Diagnosis) => {
    setEditingId(diagnosis.id);
    setEditForm({
      icd10Code: diagnosis.icd10Code,
      description: diagnosis.description,
      type: diagnosis.type,
    });
  };

  const handleSaveEdit = (id: number) => {
    if (!editForm.icd10Code.trim()) {
      toast.error("ICD-10 code is required");
      return;
    }
    if (!editForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    startTransition(async () => {
      const result = await updateConsultationDiagnosisAction({
        id,
        icd10Code: editForm.icd10Code.trim(),
        description: editForm.description.trim(),
        type: editForm.type,
      });

      if (result.status && result.data) {
        refreshDiagnoses(
          diagnoses.map((d) => (d.id === id ? result.data! : d))
        );
        setEditingId(null);
        toast.success("Diagnosis updated");
      } else {
        toast.error(result.message ?? "Failed to update diagnosis");
      }
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteConsultationDiagnosisAction({ id });

      if (result.status) {
        refreshDiagnoses(diagnoses.filter((d) => d.id !== id));
        toast.success("Diagnosis removed");
      } else {
        toast.error(result.message ?? "Failed to remove diagnosis");
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">ICD-10 Diagnoses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign ICD-10 codes to document this consultation&apos;s diagnoses
          </p>
        </div>
        {!isResolved && myActiveHp && !showForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Diagnosis
          </Button>
        )}
      </div>

      {showForm && !isResolved && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            New Diagnosis
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Label className="text-xs">Search ICD-10 *</Label>
              <ICD10Combobox
                icd10Code={form.icd10Code}
                description={form.description}
                onSelect={(result) =>
                  setForm({
                    ...form,
                    icd10Code: result.code,
                    description: result.description,
                  })
                }
                onClear={() => setForm({ ...form, icd10Code: "", description: "" })}
              />
            </div>
            {(form.icd10Code || form.description) && (
              <>
                <div>
                  <Label className="text-xs">ICD-10 Code</Label>
                  <Input
                    className="h-8 text-xs mt-1 font-mono"
                    placeholder="e.g. J06.9"
                    value={form.icd10Code}
                    onChange={(e) => setForm({ ...form, icd10Code: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. Acute upper respiratory infection"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Label className="text-xs">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAGNOSIS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={handleAdd}
                disabled={isPending}
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs gap-1"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {diagnoses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 py-10 text-center">
          <p className="text-sm text-muted-foreground">No diagnoses recorded</p>
          {!isResolved && myActiveHp && (
            <p className="text-xs text-muted-foreground mt-1">
              Use &ldquo;Add Diagnosis&rdquo; to attach ICD-10 codes
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {diagnoses.map((diagnosis) =>
            editingId === diagnosis.id ? (
              <div
                key={diagnosis.id}
                className="rounded-lg border border-primary/40 bg-muted/30 p-3 space-y-2"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Search ICD-10</Label>
                    <ICD10Combobox
                      icd10Code={editForm.icd10Code}
                      description={editForm.description}
                      onSelect={(result) =>
                        setEditForm({
                          ...editForm,
                          icd10Code: result.code,
                          description: result.description,
                        })
                      }
                      onClear={() =>
                        setEditForm({ ...editForm, icd10Code: "", description: "" })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ICD-10 Code *</Label>
                    <Input
                      className="h-7 text-xs mt-1"
                      value={editForm.icd10Code}
                      onChange={(e) =>
                        setEditForm({ ...editForm, icd10Code: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      className="h-7 text-xs mt-1"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={editForm.type}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, type: v })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAGNOSIS_TYPES.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-xs"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleSaveEdit(diagnosis.id)}
                    disabled={isPending}
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditingId(null)}
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={diagnosis.id}
                className="rounded-lg border border-border/50 bg-background px-4 py-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {diagnosis.icd10Code}
                    </span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 h-4 border-0 font-medium ${TYPE_COLORS[diagnosis.type] ?? ""
                        }`}
                      variant="outline"
                    >
                      {
                        DIAGNOSIS_TYPES.find(
                          (t) => t.value === diagnosis.type
                        )?.label ?? diagnosis.type
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">
                    {diagnosis.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    By{" "}
                    {diagnosis.HealthCareProvider.HPProfile?.name ??
                      `${diagnosis.HealthCareProvider.User?.firstName ?? ""} ${diagnosis.HealthCareProvider.User?.lastName ?? ""
                        }`.trim()}
                  </p>
                </div>
                {!isResolved && myActiveHp && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleStartEdit(diagnosis)}
                      disabled={isPending}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(diagnosis.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
