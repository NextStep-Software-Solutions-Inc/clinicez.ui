"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import {
  importICD10BatchAction,
  finalizeICD10ImportAction,
  importRVSProcedureBatchAction,
  finalizeRVSImportAction,
} from "@/actions/super-admin/import-medical-codes.action";
import type { ICD10Row, RVSProcedureRow, RVSProcedureType } from "@/actions/super-admin/import-medical-codes.action";

const BATCH_SIZE = 100;

type ImportType = "icd10" | "rvs";

interface ImportResult {
  totalRows: number;
  upserted: number;
  deactivated: number;
  errors: string[];
}

interface ImportCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    return row;
  });
}

export function ImportCodesDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportCodesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<ImportType>("icd10");
  const [rvsType, setRvsType] = useState<RVSProcedureType>("imaging");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFileName(null);
    setParsedRows(null);
    setHeaders([]);
    setParseError(null);
    setProgress(0);
    setProgressLabel("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setParsedRows(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          setParseError("File must have at least a header row and one data row.");
          return;
        }
        setHeaders(rows[0]);
        setParsedRows(rows.slice(1)); // data rows only
      } catch {
        setParseError("Failed to parse CSV. Please ensure it is a valid CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const normalizeICD10Row = (
    row: string[],
    hdrs: string[]
  ): ICD10Row | null => {
    const idx = (name: string) =>
      hdrs.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));

    const codeIdx = idx("code");
    const descIdx = idx("desc") !== -1 ? idx("desc") : idx("name");
    const catIdx = idx("cat") !== -1 ? idx("cat") : idx("chapter");

    if (codeIdx === -1 || descIdx === -1) return null;

    return {
      code: row[codeIdx] ?? "",
      description: row[descIdx] ?? "",
      category: catIdx !== -1 ? (row[catIdx] ?? "") : undefined,
    };
  };

  const normalizeRVSRow = (
    row: string[],
    hdrs: string[]
  ): RVSProcedureRow | null => {
    const idx = (name: string) =>
      hdrs.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));

    const nameIdx = idx("name") !== -1 ? idx("name") : idx("procedure");
    const catIdx = idx("cat") !== -1 ? idx("cat") : idx("type");
    const rvsIdx = idx("rvs") !== -1 ? idx("rvs") : idx("code");
    const descIdx = idx("desc");

    if (nameIdx === -1 || catIdx === -1) return null;

    return {
      name: row[nameIdx] ?? "",
      category: row[catIdx] ?? "",
      rvsCode: rvsIdx !== -1 ? (row[rvsIdx] ?? "") : undefined,
      description: descIdx !== -1 ? (row[descIdx] ?? "") : undefined,
    };
  };

  const handleImport = async () => {
    if (!parsedRows || parsedRows.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    const errors: string[] = [];
    let totalUpserted = 0;

    const totalBatches = Math.ceil(parsedRows.length / BATCH_SIZE);
    // Reserve 90% of bar for batches, 10% for finalize
    const batchWeight = 90 / totalBatches;

    if (importType === "icd10") {
      const importedCodes: string[] = [];

      for (let b = 0; b < totalBatches; b++) {
        const slice = parsedRows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        const rows: ICD10Row[] = slice
          .map((r) => normalizeICD10Row(r, headers))
          .filter((r): r is ICD10Row => r !== null && r.code.trim() !== "");

        importedCodes.push(...rows.map((r) => r.code.trim().toUpperCase()));

        setProgressLabel(`Processing batch ${b + 1} of ${totalBatches}…`);
        const batchResult = await importICD10BatchAction(rows);
        totalUpserted += batchResult.upserted;
        errors.push(...batchResult.errors);
        setProgress(Math.round((b + 1) * batchWeight));
      }

      setProgressLabel("Finalizing – deactivating removed codes…");
      const finalResult = await finalizeICD10ImportAction(importedCodes);

      setProgress(100);
      setProgressLabel("Import complete");
      setResult({
        totalRows: parsedRows.length,
        upserted: totalUpserted,
        deactivated: finalResult.deactivated,
        errors,
      });
    } else {
      const importedNames: string[] = [];

      for (let b = 0; b < totalBatches; b++) {
        const slice = parsedRows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        const rows: RVSProcedureRow[] = slice
          .map((r) => normalizeRVSRow(r, headers))
          .filter((r): r is RVSProcedureRow => r !== null && r.name.trim() !== "");

        importedNames.push(...rows.map((r) => r.name.trim()));

        setProgressLabel(`Processing batch ${b + 1} of ${totalBatches}…`);
        const batchResult = await importRVSProcedureBatchAction(rvsType, rows);
        totalUpserted += batchResult.upserted;
        errors.push(...batchResult.errors);
        setProgress(Math.round((b + 1) * batchWeight));
      }

      setProgressLabel("Finalizing – deactivating removed procedures…");
      const finalResult = await finalizeRVSImportAction(rvsType, importedNames);

      setProgress(100);
      setProgressLabel("Import complete");
      setResult({
        totalRows: parsedRows.length,
        upserted: totalUpserted,
        deactivated: finalResult.deactivated,
        errors,
      });
    }

    setImporting(false);
    toast.success("Import finished successfully");
    onImportComplete?.();
  };

  const icd10Headers = ["code", "description", "category"];
  const rvsHeaders = ["name", "category", "rvsCode", "description"];
  const expectedHeaders = importType === "icd10" ? icd10Headers : rvsHeaders;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!importing) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Medical Codes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Import Type</Label>
              <Select
                value={importType}
                onValueChange={(v) => {
                  setImportType(v as ImportType);
                  reset();
                }}
                disabled={importing}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icd10">ICD-10 Diagnosis Codes</SelectItem>
                  <SelectItem value="rvs">RVS Procedures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importType === "rvs" && (
              <div>
                <Label className="text-xs mb-1 block">Procedure Category</Label>
                <Select
                  value={rvsType}
                  onValueChange={(v) => setRvsType(v as RVSProcedureType)}
                  disabled={importing}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="laboratory">Laboratory</SelectItem>
                    <SelectItem value="heart_station">Heart Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* CSV format hint */}
          <div className="rounded-md bg-muted/50 border border-border/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Expected CSV columns:
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {expectedHeaders.map((h) => (
                <Badge key={h} variant="secondary" className="text-[10px] font-mono">
                  {h}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              First row must be a header. Column names are matched by keyword (case-insensitive).
            </p>
          </div>

          {/* File picker */}
          {!result && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={importing}
              />
              <div
                className="border-2 border-dashed border-border/60 rounded-lg py-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                onClick={() => !importing && fileInputRef.current?.click()}
              >
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{fileName}</span>
                    {!importing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reset();
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a CSV file
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Row count preview */}
          {parsedRows && !result && !importing && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{parsedRows.length}</span>{" "}
              data rows detected. Columns:{" "}
              <span className="font-mono text-xs">{headers.join(", ")}</span>
            </p>
          )}

          {/* Progress bar */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progressLabel} ({progress}%)
              </p>
            </div>
          )}

          {/* Result summary */}
          {result && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Import Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded bg-background border border-border/50 px-2 py-2">
                  <p className="text-lg font-bold text-foreground">{result.totalRows}</p>
                  <p className="text-[10px] text-muted-foreground">Total Rows</p>
                </div>
                <div className="rounded bg-background border border-border/50 px-2 py-2">
                  <p className="text-lg font-bold text-emerald-600">{result.upserted}</p>
                  <p className="text-[10px] text-muted-foreground">Added / Updated</p>
                </div>
                <div className="rounded bg-background border border-border/50 px-2 py-2">
                  <p className="text-lg font-bold text-amber-600">{result.deactivated}</p>
                  <p className="text-[10px] text-muted-foreground">Deactivated</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-destructive cursor-pointer">
                    {result.errors.length} row error(s) – click to expand
                  </summary>
                  <ul className="mt-1 max-h-28 overflow-y-auto text-[11px] text-muted-foreground space-y-0.5">
                    {result.errors.map((e, i) => (
                      <li key={i} className="truncate">
                        {e}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            {result ? (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    reset();
                  }}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!parsedRows || parsedRows.length === 0 || importing}
                >
                  {importing ? "Importing…" : "Import"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
