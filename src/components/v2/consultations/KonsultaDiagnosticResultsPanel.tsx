"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trash2, FlaskConical, Loader2, ShieldCheck } from "lucide-react";
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
import { toast } from "sonner";
import {
  createKonsultaDiagnosticResultAction,
  deleteKonsultaDiagnosticResultAction,
  getKonsultaDiagnosticResultsAction,
} from "@/actions/consultation/konsulta-diagnostic.action";
import { Checkbox } from "@/components/ui/checkbox";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ExamType =
  | "FBS" | "RBS" | "CBC" | "URINALYSIS" | "CHESTXRAY" | "SPUTUM"
  | "LIPIDPROFILE" | "ECG" | "FECALYSIS" | "PAPSMEAR" | "OGTT"
  | "FOBT" | "CREATININE" | "PPDTest" | "HbA1c" | "OTHERDIAGEXAM";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "multiselect";
  unit?: string;
  placeholder?: string;
  span?: "full";
  options?: { value: string; label: string }[];
  dependsOn?: { key: string; value: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-exam-type field definitions (keys match resultData keys → DTD attrs)
// ─────────────────────────────────────────────────────────────────────────────

const CHESTXRAY_FINDINGS = [
  { value: "1", label: "1 - NORMAL" },
  { value: "2", label: "2 - PNEUMONIA" },
  { value: "3", label: "3 - PTB/KOCHS" },
  { value: "4", label: "4 - PLEURAL EFFUSION" },
  { value: "5", label: "5 - PNEUMOTHORAX" },
  { value: "6", label: "6 - EMPHYSEMA" },
  { value: "7", label: "7 - CHRONIC BRONCHITIS" },
  { value: "8", label: "8 - BRONCHIECTASIS" },
  { value: "9", label: "9 - ACUTE BRONCHITIS" },
  { value: "10", label: "10 - BRONCHIOLITIS" },
  { value: "11", label: "11 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE" },
  { value: "12", label: "12 - PULMONARY MASS" },
  { value: "99", label: "99 - OTHERS" },
];

const CHESTXRAY_OBSERVATIONS = [
  { value: "1", label: "1 - INFILTRATES" },
  { value: "2", label: "2 - CALCIFICATION" },
  { value: "3", label: "3 - CONSOLIDATION" },
  { value: "4", label: "4 - CAVITY" },
  { value: "5", label: "5 - DENSITIES" },
  { value: "6", label: "6 - PLEURAL EFFUSION" },
  { value: "7", label: "7 - PNEUMOTHORAX" },
  { value: "8", label: "8 - BLEB" },
  { value: "9", label: "9 - CARDIOMEGALY" },
  { value: "10", label: "10 - THICKENING" },
  { value: "11", label: "11 - HYPERAERATION/ EMPHYSEMATOUS CHANGES" },
  { value: "12", label: "12 - MASS" },
  { value: "99", label: "99 - OTHERS" },
];

const SPUTUM_DATA_COLLECTION = [
  { value: "1", label: "1 - First Collection" },
  { value: "2", label: "2 - Second Collection" },
  { value: "3", label: "3 - Third Collection" },
  { value: "X", label: "X - Not Applicable" },
];

const SPUTUM_FINDINGS = [
  { value: "1", label: "1 - Essentially Normal" },
  { value: "2", label: "2 - With Findings" },
];

const ECG_FINDINGS = [
  { value: "1", label: "1 - Essentially Normal" },
  { value: "2", label: "2 - With Findings" },
];

const FECALYSIS_COLOR = [
  { value: "1", label: "1 - Brown" },
  { value: "2", label: "2 - Black" },
  { value: "3", label: "3 - Red" },
  { value: "4", label: "4 - White/Grey" },
  { value: "5", label: "5 - Yellow" },
  { value: "6", label: "6 - Green" },
];

const FECALYSIS_CONSISTENCY = [
  { value: "1", label: "1 - Soft" },
  { value: "2", label: "2 - Well-Formed" },
  { value: "3", label: "3 - Semi-Formed" },
  { value: "4", label: "4 - Watery" },
  { value: "5", label: "5 - Mucoid" },
  { value: "6", label: "6 - Hard" },
];

const FECALYSIS_BLOOD = [
  { value: "P", label: "P - Present" },
  { value: "A", label: "A - Absent" },
];

const FOBT_FINDINGS = [
  { value: "P", label: "P - Positive" },
  { value: "N", label: "N - Negative" },
];

const PPDTEST_FINDINGS = [
  { value: "P", label: "P - Positive" },
  { value: "N", label: "N - Negative" },
];

const BASE_FIELDS: FieldDef[] = [
  { key: "referralFacility", label: "Referral Facility", placeholder: "Facility name", span: "full" },
  { key: "labDate",          label: "Lab Date",          type: "date" },
  { key: "dateAdded",        label: "Date Added",        type: "date" },
  { key: "diagnosticLabFee", label: "Lab Fee",           type: "number", placeholder: "0.00" },
];

const EXAM_FIELDS: Record<ExamType, FieldDef[]> = {
  FBS: [
    { key: "glucoseMg",   label: "Glucose",  type: "number", unit: "mg/dL" },
    { key: "glucoseMmol", label: "Glucose",  type: "number", unit: "mmol/L" },
  ],
  RBS: [
    { key: "glucoseMg",   label: "Glucose",  type: "number", unit: "mg/dL" },
    { key: "glucoseMmol", label: "Glucose",  type: "number", unit: "mmol/L" },
  ],
  CBC: [
    { key: "hematocrit",     label: "Hematocrit",      unit: "%" },
    { key: "hemoglobinG",    label: "Hemoglobin",      unit: "g/dL" },
    { key: "hemoglobinMmol", label: "Hemoglobin",      unit: "mmol/L" },
    { key: "mhcPg",          label: "MHC",             unit: "pg" },
    { key: "mhcFmol",        label: "MHC",             unit: "fmol" },
    { key: "mchcGhb",        label: "MCHC",            unit: "g/Hb" },
    { key: "mchcMmol",       label: "MCHC",            unit: "mmol/L" },
    { key: "mcvUm",          label: "MCV",             unit: "µm³" },
    { key: "mcvFl",          label: "MCV",             unit: "fL" },
    { key: "wbc1000",        label: "WBC",             unit: "×1000" },
    { key: "wbc10",          label: "WBC",             unit: "×10⁹/L" },
    { key: "myelocyte",      label: "Myelocyte",       unit: "%" },
    { key: "neutrophilsBnd", label: "Neutrophils Bnd", unit: "%" },
    { key: "neutrophilsSeg", label: "Neutrophils Seg", unit: "%" },
    { key: "lymphocytes",    label: "Lymphocytes",     unit: "%" },
    { key: "monocytes",      label: "Monocytes",       unit: "%" },
    { key: "eosinophils",    label: "Eosinophils",     unit: "%" },
    { key: "basophils",      label: "Basophils",       unit: "%" },
    { key: "platelet",       label: "Platelet",        unit: "×10⁹/L" },
  ],
  URINALYSIS: [
    { key: "gravity",        label: "Specific Gravity" },
    { key: "appearance",     label: "Appearance" },
    { key: "color",          label: "Color" },
    { key: "glucose",        label: "Glucose" },
    { key: "proteins",       label: "Proteins" },
    { key: "ketones",        label: "Ketones" },
    { key: "ph",             label: "pH" },
    { key: "rbCells",        label: "RBC Cells" },
    { key: "wbCells",        label: "WBC Cells" },
    { key: "bacteria",       label: "Bacteria" },
    { key: "crystals",       label: "Crystals" },
    { key: "bladderCell",    label: "Bladder Cell" },
    { key: "squamousCell",   label: "Squamous Cell" },
    { key: "tubularCell",    label: "Tubular Cell" },
    { key: "broadCasts",     label: "Broad Casts" },
    { key: "epithelialCast", label: "Epithelial Cast" },
    { key: "granularCast",   label: "Granular Cast" },
    { key: "hyalineCast",    label: "Hyaline Cast" },
    { key: "rbcCast",        label: "RBC Cast" },
    { key: "waxyCast",       label: "Waxy Cast" },
    { key: "wcCast",         label: "WC Cast" },
    { key: "albumin",        label: "Albumin" },
    { key: "pusCells",       label: "Pus Cells" },
  ],
  CHESTXRAY: [
    { key: "findings",            label: "Findings",             type: "select", options: CHESTXRAY_FINDINGS, span: "full" },
    { key: "remarksFindings",     label: "Remarks on Findings",  span: "full", dependsOn: { key: "findings", value: "99" } },
    { key: "observation",         label: "Observation",          type: "multiselect", options: CHESTXRAY_OBSERVATIONS, span: "full" },
    { key: "remarksObservation",  label: "Remarks on Observation", span: "full", dependsOn: { key: "observation", value: "99" } },
  ],
  SPUTUM: [
    { key: "dataCollection", label: "Data Collection", type: "select", options: SPUTUM_DATA_COLLECTION, span: "full" },
    { key: "findings",       label: "Findings",        type: "select", options: SPUTUM_FINDINGS, span: "full" },
    { key: "remarks",        label: "Remarks",         span: "full", dependsOn: { key: "findings", value: "2" } },
    { key: "noPlusses",      label: "No. of Plusses",  dependsOn: { key: "findings", value: "2" } },
  ],
  LIPIDPROFILE: [
    { key: "ldl",           label: "LDL",           type: "number", unit: "mg/dL" },
    { key: "hdl",           label: "HDL",           type: "number", unit: "mg/dL" },
    { key: "total",         label: "Total",         type: "number", unit: "mg/dL" },
    { key: "cholesterol",   label: "Cholesterol",   type: "number", unit: "mg/dL" },
    { key: "triglycerides", label: "Triglycerides", type: "number", unit: "mg/dL" },
  ],
  ECG: [
    { key: "findings", label: "Findings", type: "select", options: ECG_FINDINGS, span: "full" },
    { key: "remarks",  label: "Remarks",  span: "full", dependsOn: { key: "findings", value: "2" } },
  ],
  FECALYSIS: [
    { key: "color",       label: "Color",       type: "select", options: FECALYSIS_COLOR },
    { key: "consistency", label: "Consistency", type: "select", options: FECALYSIS_CONSISTENCY },
    { key: "rbc",         label: "RBC",         unit: "/hpf" },
    { key: "wbc",         label: "WBC",         unit: "/hpf" },
    { key: "ova",         label: "Ova",         unit: "+/-" },
    { key: "parasite",    label: "Parasite",    unit: "+/-" },
    { key: "blood",       label: "Blood",       type: "select", options: FECALYSIS_BLOOD },
    { key: "pusCells",    label: "Pus Cells" },
  ],
  PAPSMEAR: [
    { key: "findings",   label: "Findings",   span: "full" },
    { key: "impression", label: "Impression", span: "full" },
  ],
  OGTT: [
    { key: "examFastingMg",     label: "Fasting",    type: "number", unit: "mg/dL" },
    { key: "examFastingMmol",   label: "Fasting",    type: "number", unit: "mmol/L" },
    { key: "examOgttOneHrMg",   label: "1-hr OGTT",  type: "number", unit: "mg/dL" },
    { key: "examOgttOneHrMmol", label: "1-hr OGTT",  type: "number", unit: "mmol/L" },
    { key: "examOgttTwoHrMg",   label: "2-hr OGTT",  type: "number", unit: "mg/dL" },
    { key: "examOgttTwoHrMmol", label: "2-hr OGTT",  type: "number", unit: "mmol/L" },
  ],
  FOBT:        [{ key: "findings", label: "Findings", type: "select", options: FOBT_FINDINGS, span: "full" }],
  CREATININE:  [{ key: "findings", label: "Findings", type: "number", unit: "mg/dL", span: "full" }],
  PPDTest:     [{ key: "findings", label: "Findings", type: "select", options: PPDTEST_FINDINGS, span: "full" }],
  HbA1c:       [{ key: "findings", label: "Findings / HbA1c Value", type: "number", unit: "mmol/mol", span: "full" }],
  OTHERDIAGEXAM: [
    { key: "othDiagExam", label: "Exam Name", span: "full" },
    { key: "findings",    label: "Findings",  span: "full" },
  ],
};

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "CHESTXRAY",    label: "Chest X-Ray" },
  { value: "CBC",          label: "Complete Blood Count (CBC)" },
  { value: "CREATININE",   label: "Creatinine" },
  { value: "ECG",          label: "ECG / EKG" },
  { value: "FBS",          label: "Fasting Blood Sugar (FBS)" },
  { value: "FOBT",         label: "Fecal Occult Blood Test (FOBT)" },
  { value: "FECALYSIS",    label: "Fecalysis" },
  { value: "HbA1c",        label: "Glycated Hemoglobin (HbA1c)" },
  { value: "LIPIDPROFILE", label: "Lipid Profile" },
  { value: "OGTT",         label: "Oral Glucose Tolerance Test (OGTT)" },
  { value: "PAPSMEAR",     label: "Pap Smear" },
  { value: "SPUTUM",       label: "Sputum Exam" },
  { value: "URINALYSIS",   label: "Urinalysis" },
  { value: "OTHERDIAGEXAM",label: "Other Diagnostic Exam" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface KonsultaDiagnosticResultsPanelProps {
  consultationTicketId?: number;
  clinicPatientId: number;
  hciCaseNo?: string;
  hciTransNo?: string;
  isResolved?: boolean;
}

type DiagResult = {
  id: string;
  consultationTicketId?: number | null;
  resultType: string;
  resultData: Record<string, string>;
  hciCaseNo: string;
  hciTransNo: string;
  transDate: string | null;
  createdAt: Date;
};

export default function KonsultaDiagnosticResultsPanel({
  consultationTicketId,
  clinicPatientId,
  hciCaseNo,
  hciTransNo,
  isResolved = false,
}: KonsultaDiagnosticResultsPanelProps) {
  const [results, setResults] = useState<DiagResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const [examType, setExamType] = useState<ExamType | "">("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const payload = consultationTicketId ? { consultationTicketId } : { clinicPatientId };
      const res = await getKonsultaDiagnosticResultsAction(payload);
      if (res.data) setResults(res.data as unknown as DiagResult[]);
      setLoading(false);
    })();
  }, [consultationTicketId, clinicPatientId]);

  // Reset field values when exam type changes
  const handleExamTypeChange = (val: string) => {
    setExamType(val as ExamType);
    setFieldValues({
      status: "D",
      diagnosticLabFee: "0.00",
      dateAdded: new Date().toISOString().split("T")[0],
    });
  };

  const setField = (key: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [key]: value }));

  const handleAdd = () => {
    if (!examType) { toast.error("Please select an exam type"); return; }
    startSaving(async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await createKonsultaDiagnosticResultAction({
        consultationTicketId: consultationTicketId || null,
        clinicPatientId,
        hciCaseNo: hciCaseNo || "",
        hciTransNo: hciTransNo || "",
        resultType: examType,
        resultData: fieldValues,
        transDate: today,
      });
      if (res.data) {
        setResults((prev) => [res.data as unknown as DiagResult, ...prev]);
        toast.success("Diagnostic result added");
        setExamType("");
        setFieldValues({});
        setShowForm(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    startDeleting(async () => {
      const res = await deleteKonsultaDiagnosticResultAction(id);
      if (res.data !== undefined) {
        setResults((prev) => prev.filter((r) => r.id !== id));
        toast.success("Diagnostic result removed");
      }
    });
  };

  const getTypeLabel = (value: string) =>
    EXAM_TYPES.find((t) => t.value === value)?.label ?? value;

  const activeFields =
    (examType ? [...BASE_FIELDS, ...EXAM_FIELDS[examType as ExamType]] : BASE_FIELDS).filter((field) => {
      if (!field.dependsOn) return true;
      const val = fieldValues[field.dependsOn.key] || "";
      return val.split(";").includes(field.dependsOn.value);
    });

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading diagnostic results...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-end">
        {!isResolved && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3 w-3" />
            Add Result
          </Button>
        )}
      </div>

      {/* Dynamic Add Form */}
      {showForm && (
        <div className="rounded-lg border border-teal-200 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 p-3 space-y-3">
          {/* Exam type selector */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Exam Type
            </Label>
            <Select value={examType} onValueChange={handleExamTypeChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fields */}
          {examType && (
            <div className="grid grid-cols-2 gap-2">
              {activeFields.map((field) => (
                <div
                  key={field.key}
                  className={field.span === "full" ? "col-span-2 space-y-1" : "space-y-1"}
                >
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {field.label}
                    {field.unit && (
                      <span className="ml-1 normal-case font-normal text-muted-foreground/60">
                        ({field.unit})
                      </span>
                    )}
                  </Label>
                  {field.type === "select" ? (
                    <Select
                      value={fieldValues[field.key] ?? ""}
                      onValueChange={(val) => setField(field.key, val)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "multiselect" ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                      {field.options?.map((opt) => {
                        const currentValues = (fieldValues[field.key] || "").split(";").filter(Boolean);
                        const isSelected = currentValues.includes(opt.value);
                        return (
                          <label key={opt.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                let newValues = [...currentValues];
                                if (checked) {
                                  newValues.push(opt.value);
                                } else {
                                  newValues = newValues.filter((v) => v !== opt.value);
                                }
                                setField(field.key, newValues.join(";"));
                              }}
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <Input
                      type={field.type ?? "text"}
                      value={fieldValues[field.key] ?? ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ""}
                      className="h-7 text-xs"
                    />
                  )}
                </div>
              ))}

              {/* Status field */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={fieldValues.status ?? "D"}
                  onValueChange={(v) => setField("status", v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D" className="text-xs">D — Done</SelectItem>
                    <SelectItem value="N" className="text-xs">N — Not yet done</SelectItem>
                    <SelectItem value="X" className="text-xs">X — Deferred</SelectItem>
                    <SelectItem value="W" className="text-xs">W — Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => { setShowForm(false); setExamType(""); setFieldValues({}); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={saving || !examType}
              onClick={handleAdd}
            >
              {saving ? "Saving…" : "Add"}
            </Button>
          </div>
        </div>
      )}

      {/* Results list */}
      {results.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <FlaskConical className="h-5 w-5 mx-auto mb-1.5 opacity-30" />
          No diagnostic results recorded.
        </div>
      ) : (
        <div className="space-y-1">
          {results.map((r) => {
            const data = typeof r.resultData === "object" && r.resultData !== null
              ? r.resultData
              : {};
            // Pick best summary value to display
            const summary =
              data.findings ?? data.glucoseMg ?? data.hematocrit ??
              data.ldl ?? data.examFastingMg ?? data.gravity ?? data.color ?? "";
            const summaryUnit = data.glucoseMg ? " mg/dL" : "";
            return (
              <div
                key={r.id}
                className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-4 font-mono shrink-0">
                      {r.resultType}
                    </Badge>
                    <span className="font-medium truncate">{getTypeLabel(r.resultType)}</span>
                    <Badge variant="secondary" className="ml-2 text-[9px] h-4 leading-none px-1.5 opacity-80">
                      {r.consultationTicketId ? "Consultation" : "Profiling"}
                    </Badge>
                  </div>
                  {summary && (
                    <p className="text-muted-foreground mt-0.5">
                      Result:{" "}
                      <span className="font-medium text-foreground">
                        {summary}{summaryUnit}
                      </span>
                    </p>
                  )}
                  {data.labDate && (
                    <p className="text-muted-foreground/70 text-[10px]">Lab date: {data.labDate}</p>
                  )}
                </div>
                {!isResolved && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive/60 hover:text-destructive shrink-0"
                    disabled={deleting}
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
