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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ICD10Row,
  RVSProcedureRow,
  RVSProcedureType,
} from "@/actions/super-admin/import-medical-codes.action";

const BATCH_SIZE = 100;

type ImportType = "icd10" | "rvs";
type FileFormat = "txt" | "csv";

// ─── ICD-10 TXT configurable field positions ──────────────────────────────────

interface FieldConfig {
  /** 1-indexed start position */
  start: number;
  /** character count */
  length: number;
}

interface ICD10TxtConfig {
  order: FieldConfig;
  code: FieldConfig;
  hipaa: FieldConfig;
  shortDesc: FieldConfig;
  /** Long description always reads from this 1-indexed position to end of line */
  longDescStart: number;
}

const CMS_DEFAULTS: ICD10TxtConfig = {
  order:         { start: 1,  length: 5  },
  code:          { start: 7,  length: 7  },
  hipaa:         { start: 15, length: 1  },
  shortDesc:     { start: 17, length: 60 },
  longDescStart: 78,
};

function parseTXTWithConfig(text: string, cfg: ICD10TxtConfig): ICD10Row[] {
  const rows: ICD10Row[] = [];
  const extract = (line: string, s: number, l: number) =>
    line.substring(s - 1, s - 1 + l).trim();

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line.length < cfg.code.start + cfg.code.length - 1) continue;

    const code = extract(line, cfg.code.start, cfg.code.length);
    if (!code) continue;

    const shortDescription = extract(line, cfg.shortDesc.start, cfg.shortDesc.length);
    const longDescription =
      line.length >= cfg.longDescStart
        ? line.substring(cfg.longDescStart - 1).trim()
        : "";

    rows.push({
      orderNum:
        parseInt(extract(line, cfg.order.start, cfg.order.length), 10) || undefined,
      code,
      description: shortDescription,
      shortDescription,
      longDescription,
      hippaCovered: extract(line, cfg.hipaa.start, cfg.hipaa.length) === "1",
    });
  }
  return rows;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
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

// Worker code string for inline blob worker
const PARSE_WORKER_CODE = `
function parseCSV(text) {
  const lines = text.split(/\\r?\\n/).filter(function(l) { return l.trim().length > 0; });
  return lines.map(function(line) {
    let row = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    return row;
  });
}

function parseTXTWithConfig(text, cfg) {
  const rows = [];
  function extract(line, s, l) { return line.substring(s - 1, s - 1 + l).trim(); }
  const lines = text.split(/\\r?\\n/);
  for (let j = 0; j < lines.length; j++) {
    const line = lines[j];
    if (!line.trim()) continue;
    if (line.length < cfg.code.start + cfg.code.length - 1) continue;
    const code = extract(line, cfg.code.start, cfg.code.length);
    if (!code) continue;
    const shortDescription = extract(line, cfg.shortDesc.start, cfg.shortDesc.length);
    const longDescription = line.length >= cfg.longDescStart ? line.substring(cfg.longDescStart - 1).trim() : '';
    const orderRaw = parseInt(extract(line, cfg.order.start, cfg.order.length), 10);
    rows.push({
      orderNum: isNaN(orderRaw) ? undefined : orderRaw,
      code: code,
      description: shortDescription,
      shortDescription: shortDescription,
      longDescription: longDescription,
      hippaCovered: extract(line, cfg.hipaa.start, cfg.hipaa.length) === '1',
    });
  }
  return rows;
}

self.onmessage = function(e) {
  const type = e.data.type;
  try {
    if (type === 'csv') {
      self.postMessage({ success: true, rows: parseCSV(e.data.text) });
    } else if (type === 'txt') {
      self.postMessage({ success: true, rows: parseTXTWithConfig(e.data.text, e.data.config) });
    }
  } catch(err) {
    self.postMessage({ success: false, error: err.message });
  }
};
`;

function runParseWorker<T>(type: 'csv' | 'txt', text: string, config?: ICD10TxtConfig): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([PARSE_WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    worker.onmessage = (e: MessageEvent<{ success: boolean; rows: T[]; error?: string }>) => {
      URL.revokeObjectURL(url);
      worker.terminate();
      if (e.data.success) resolve(e.data.rows);
      else reject(new Error(e.data.error ?? 'Parse worker failed'));
    };
    worker.onerror = (e: ErrorEvent) => {
      URL.revokeObjectURL(url);
      worker.terminate();
      reject(new Error(e.message));
    };
    worker.postMessage({ type, text, config });
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportResult {
  totalRows: number;
  upserted: number;
  deactivated: number;
  errors: string[];
}

/** Row type accepted by the upload worker — either ICD-10 or RVS (with optional procedureType) */
type UploadRow = ICD10Row | (RVSProcedureRow & { procedureType?: RVSProcedureType });

// ─── Upload worker (batch upsert via API routes, fully off the main thread) ───

interface UploadProgressMessage {
  type: 'progress';
  progress: number;
  label: string;
}

interface UploadCompleteMessage {
  type: 'complete';
  result: ImportResult;
}

interface UploadErrorMessage {
  type: 'error';
  message: string;
}

type UploadWorkerMessage = UploadProgressMessage | UploadCompleteMessage | UploadErrorMessage;

/**
 * Inline blob-URL worker that handles all HTTP batch uploads.
 * Runs entirely off the main thread; communicates progress via postMessage.
 * Uses fetch with credentials:'include' so Clerk session cookies are forwarded.
 */
const UPLOAD_WORKER_CODE = `
async function importICD10Batches(rows, batchSize) {
  const totalBatches = Math.ceil(rows.length / batchSize);
  const batchWeight = 90 / (totalBatches || 1);
  let totalUpserted = 0;
  const errors = [];
  const importedCodes = [];

  for (let b = 0; b < totalBatches; b++) {
    const slice = rows.slice(b * batchSize, (b + 1) * batchSize);
    importedCodes.push(...slice.map(r => r.code.trim().toUpperCase()));
    self.postMessage({ type: 'progress', progress: Math.round((b + 1) * batchWeight), label: 'Processing batch ' + (b + 1) + ' of ' + totalBatches + '...' });

    const res = await fetch('/api/super-admin/import/icd10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rows: slice }),
    });
    if (!res.ok) throw new Error('Batch ' + (b + 1) + ' failed: HTTP ' + res.status);
    const batchResult = await res.json();
    totalUpserted += batchResult.upserted || 0;
    if (batchResult.errors) errors.push(...batchResult.errors);
  }

  self.postMessage({ type: 'progress', progress: 95, label: 'Finalizing – deactivating removed codes...' });
  const finalRes = await fetch('/api/super-admin/import/icd10/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ importedCodes }),
  });
  if (!finalRes.ok) throw new Error('Finalize failed: HTTP ' + finalRes.status);
  const finalResult = await finalRes.json();

  return { totalRows: rows.length, upserted: totalUpserted, deactivated: finalResult.deactivated || 0, errors };
}

async function importRVSBatches(rows, batchSize) {
  const grouped = { imaging: [], laboratory: [], heart_station: [] };
  const errors = [];

  for (const row of rows) {
    if (row.procedureType && grouped[row.procedureType]) {
      grouped[row.procedureType].push(row);
    } else {
      errors.push('Skipped row "' + row.name + '" – missing or invalid procedureType');
    }
  }

  const types = ['imaging', 'laboratory', 'heart_station'];
  const totalBatchCount = types.reduce((sum, t) => sum + Math.ceil(grouped[t].length / batchSize), 0);
  let overallBatch = 0;
  let totalUpserted = 0;
  const importedByType = { imaging: [], laboratory: [], heart_station: [] };

  for (const type of types) {
    const typeRows = grouped[type];
    if (typeRows.length === 0) continue;
    const totalBatches = Math.ceil(typeRows.length / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const slice = typeRows.slice(b * batchSize, (b + 1) * batchSize);
      importedByType[type].push(...slice.map(r => r.name.trim()));
      overallBatch++;
      const progress = Math.min(90, Math.round((overallBatch / (totalBatchCount || 1)) * 90));
      self.postMessage({ type: 'progress', progress, label: 'Processing ' + type + ': batch ' + (b + 1) + ' of ' + totalBatches + '...' });

      const res = await fetch('/api/super-admin/import/rvs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, rows: slice }),
      });
      if (!res.ok) throw new Error('RVS batch failed: HTTP ' + res.status);
      const batchResult = await res.json();
      totalUpserted += batchResult.upserted || 0;
      if (batchResult.errors) errors.push(...batchResult.errors);
    }
  }

  self.postMessage({ type: 'progress', progress: 95, label: 'Finalizing – deactivating removed procedures...' });
  let totalDeactivated = 0;
  for (const type of types) {
    if (importedByType[type].length === 0) continue;
    const finalRes = await fetch('/api/super-admin/import/rvs/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type, importedNames: importedByType[type] }),
    });
    if (!finalRes.ok) throw new Error('RVS finalize failed: HTTP ' + finalRes.status);
    const finalResult = await finalRes.json();
    totalDeactivated += finalResult.deactivated || 0;
  }

  return { totalRows: rows.length, upserted: totalUpserted, deactivated: totalDeactivated, errors };
}

self.onmessage = async function(e) {
  const { importType, rows, batchSize } = e.data;
  try {
    const result = importType === 'icd10'
      ? await importICD10Batches(rows, batchSize)
      : await importRVSBatches(rows, batchSize);
    self.postMessage({ type: 'complete', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};
`;

function runUploadWorker(
  importType: 'icd10' | 'rvs',
  rows: UploadRow[],
  batchSize: number,
  onProgress: (progress: number, label: string) => void,
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([UPLOAD_WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.onmessage = (e: MessageEvent<UploadWorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress(msg.progress, msg.label);
      } else if (msg.type === 'complete') {
        URL.revokeObjectURL(url);
        worker.terminate();
        resolve(msg.result);
      } else {
        URL.revokeObjectURL(url);
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      URL.revokeObjectURL(url);
      worker.terminate();
      reject(new Error(e.message));
    };

    worker.postMessage({ importType, rows, batchSize });
  });
}

interface ImportCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

// ─── Dialog component ─────────────────────────────────────────────────────────

export function ImportCodesDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportCodesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [importType, setImportType] = useState<ImportType>("icd10");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileFormat, setFileFormat] = useState<FileFormat | null>(null);

  // ICD-10 TXT state
  const [rawTxtContent, setRawTxtContent] = useState<string | null>(null);
  const [icd10Config, setIcd10Config] = useState<ICD10TxtConfig>(CMS_DEFAULTS);
  const [posConfigOpen, setPosConfigOpen] = useState(false);
  const [icd10TxtRows, setIcd10TxtRows] = useState<ICD10Row[] | null>(null);

  // CSV state
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  // UI state
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const resetFileState = () => {
    setFileName(null);
    setFileFormat(null);
    setRawTxtContent(null);
    setIcd10TxtRows(null);
    setParsedRows(null);
    setHeaders([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => {
    resetFileState();
    setProgress(0);
    setProgressLabel("");
    setResult(null);
    setIcd10Config(CMS_DEFAULTS);
    setPosConfigOpen(false);
  };

  // Re-parse TXT file with updated config
  const applyTxtConfig = (cfg: ICD10TxtConfig) => {
    if (!rawTxtContent) return;
    const rows = parseTXTWithConfig(rawTxtContent, cfg);
    if (rows.length === 0) {
      setParseError("No valid rows with current positions. Verify field start/length values.");
      setIcd10TxtRows(null);
    } else {
      setParseError(null);
      setIcd10TxtRows(rows);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetFileState();
    setResult(null);
    setFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    const fmt: FileFormat = ext === "txt" ? "txt" : "csv";
    setFileFormat(fmt);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      try {
        if (fmt === "txt" && importType === "icd10") {
          setRawTxtContent(text);
          const rows = await runParseWorker<ICD10Row>('txt', text, icd10Config);
          if (rows.length === 0) {
            setParseError("No valid rows found. Check the file or adjust field positions below.");
          } else {
            setIcd10TxtRows(rows);
          }
        } else {
          const rows = await runParseWorker<string[]>('csv', text);
          if (rows.length < 2) {
            setParseError("File must have at least a header row and one data row.");
            return;
          }
          setHeaders(rows[0]);
          setParsedRows(rows.slice(1));
        }
      } catch {
        setParseError("Failed to parse file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const normalizeICD10Row = (row: string[], hdrs: string[]): ICD10Row | null => {
    const idx = (name: string) => hdrs.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    const codeIdx = idx("code");
    const shortDescIdx = idx("shortdescription");
    const longDescIdx = idx("longdescription");
    const hipaaIdx = idx("hippacovered") !== -1 ? idx("hippacovered") : -1;
    const orderIdx = idx("ordernum") !== -1 ? idx("ordernum") : -1;
    if (codeIdx === -1 || shortDescIdx === -1) return null;
    const hipaaVal = hipaaIdx !== -1 ? (row[hipaaIdx] ?? "").trim() : "";
    return {
      code: row[codeIdx] ?? "",
      description: row[shortDescIdx] ?? "",
      shortDescription: row[shortDescIdx],
      longDescription: longDescIdx !== -1 ? row[longDescIdx] : undefined,
      hippaCovered: hipaaVal === "1" || hipaaVal.toLowerCase() === "true",
      orderNum: orderIdx !== -1 ? parseInt(row[orderIdx] ?? "", 10) || undefined : undefined,
    };
  };

  const normalizeRVSRow = (row: string[], hdrs: string[]): (RVSProcedureRow & { procedureType?: RVSProcedureType }) | null => {
    const idx = (name: string) => hdrs.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    const nameExact = idx("name");
    const nameIdx = nameExact !== -1 ? nameExact : hdrs.findIndex(h => h.toLowerCase().includes("procedure"));
    const catIdx = idx("category") !== -1 ? idx("category") : hdrs.findIndex(h => h.toLowerCase().includes("cat"));
    const rvsIdx = idx("rvscode") !== -1 ? idx("rvscode") : hdrs.findIndex(h => h.toLowerCase().includes("rvs") || h.toLowerCase() === "code");
    const descIdx = hdrs.findIndex(h => h.toLowerCase().includes("desc"));
    const typeIdx = idx("proceduretype") !== -1 ? idx("proceduretype") : hdrs.findIndex(h => h.toLowerCase().includes("type"));
    if (nameIdx === -1) return null;
    const procType = typeIdx !== -1 ? (row[typeIdx] ?? "").trim().toLowerCase() : "";
    const validType = (["imaging", "laboratory", "heart_station"] as const).includes(procType as RVSProcedureType)
      ? procType as RVSProcedureType
      : undefined;
    return {
      name: row[nameIdx] ?? "",
      category: catIdx !== -1 ? row[catIdx] ?? "" : "",
      rvsCode: rvsIdx !== -1 ? row[rvsIdx] ?? undefined : undefined,
      description: descIdx !== -1 ? row[descIdx] ?? undefined : undefined,
      procedureType: validType,
    };
  };

  const totalDataRows =
    icd10TxtRows?.length ??
    parsedRows?.length ??
    0;

  const handleImport = async () => {
    if (totalDataRows === 0) return;
    setImporting(true);
    setProgress(0);
    setProgressLabel("Preparing data...");
    setResult(null);

    let succeeded = false;
    try {
      // Build the flat row list to hand off to the upload worker
      const rows: UploadRow[] =
        importType === "icd10"
          ? (icd10TxtRows
              ? icd10TxtRows
              : (parsedRows ?? [])
                  .map((r) => normalizeICD10Row(r, headers))
                  .filter((r): r is ICD10Row => r !== null && r.code.trim() !== ""))
          : (parsedRows ?? [])
              .map((r) => normalizeRVSRow(r, headers))
              .filter(
                (r): r is RVSProcedureRow & { procedureType?: RVSProcedureType } =>
                  r !== null && r.name.trim() !== ""
              );

      const result = await runUploadWorker(
        importType,
        rows,
        BATCH_SIZE,
        (prog, label) => {
          setProgress(prog);
          setProgressLabel(label);
        },
      );

      setProgress(100);
      setProgressLabel("Import complete");
      setResult(result);
      succeeded = true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }

    if (succeeded) {
      toast.success("Import finished successfully");
      onImportComplete?.();
    }
  };

  const icd10CsvHeaders = ["orderNum", "code", "hippaCovered", "shortDescription", "longDescription"];
  const rvsHeaders = ["procedureType", "name", "category", "rvsCode", "description"];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!importing) { onOpenChange(v); if (!v) reset(); }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                onValueChange={(v) => { setImportType(v as ImportType); reset(); }}
                disabled={importing}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="icd10">ICD-10 Diagnosis Codes</SelectItem>
                  <SelectItem value="rvs">RVS Procedures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Format hint */}
          <div className="rounded-md bg-muted/50 border border-border/50 px-3 py-2 space-y-1.5">
            {importType === "icd10" ? (
              <>
                <p className="text-xs font-medium text-muted-foreground">Accepted formats:</p>
                <div className="space-y-1">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground/80">
                      Official CMS fixed-width .txt (recommended)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Parses order, code, HIPAA indicator, short and long description from fixed
                      positions. Field positions are configurable after upload.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground/80">CSV fallback</p>
                    <div className="flex gap-1 flex-wrap mt-0.5">
                      {icd10CsvHeaders.map((h) => (
                        <Badge key={h} variant="secondary" className="text-[10px] font-mono">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground">CSV format</p>
                <div className="space-y-1">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground/80">Required columns:</p>
                    <div className="flex gap-1 flex-wrap mt-0.5">
                      {rvsHeaders.map((h) => (
                        <Badge key={h} variant="secondary" className="text-[10px] font-mono">
                          {h}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      procedureType must be one of: imaging, laboratory, heart_station
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* File picker */}
          {!result && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  importType === "icd10"
                    ? ".txt,.csv,text/plain,text/csv"
                    : ".csv,text/csv"
                }
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
                    {fileFormat && (
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {fileFormat}
                      </Badge>
                    )}
                    {!importing && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); resetFileState(); }}
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
                      {importType === "icd10"
                        ? "Click to select a .txt or .csv file"
                        : "Click to select a CSV file"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ICD-10 TXT: configurable field positions */}
          {importType === "icd10" && fileFormat === "txt" && rawTxtContent && !result && (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted/60 text-xs font-medium text-left transition-colors"
                onClick={() => setPosConfigOpen((v) => !v)}
                disabled={importing}
              >
                {posConfigOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Configure Field Positions
                <span className="ml-auto text-muted-foreground font-normal text-[10px]">
                  CMS defaults pre-loaded
                </span>
              </button>

              {posConfigOpen && (
                <div className="px-3 py-3 space-y-3 bg-background">
                  <div className="grid grid-cols-[1fr_80px_80px] gap-x-3 text-[11px] font-medium text-muted-foreground">
                    <span>Field</span>
                    <span className="text-center">Start (1-indexed)</span>
                    <span className="text-center">Length</span>
                  </div>

                  {(
                    [
                      { label: "Order number",     key: "order"     },
                      { label: "Code",              key: "code"      },
                      { label: "HIPAA indicator",   key: "hipaa"     },
                      { label: "Short description", key: "shortDesc" },
                    ] as const
                  ).map(({ label, key }) => (
                    <div key={key} className="grid grid-cols-[1fr_80px_80px] gap-x-3 items-center">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={icd10Config[key].start}
                        className="h-7 text-xs text-center"
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1)
                            setIcd10Config((p) => ({ ...p, [key]: { ...p[key], start: v } }));
                        }}
                        disabled={importing}
                      />
                      <Input
                        type="number"
                        min={1}
                        value={icd10Config[key].length}
                        className="h-7 text-xs text-center"
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1)
                            setIcd10Config((p) => ({ ...p, [key]: { ...p[key], length: v } }));
                        }}
                        disabled={importing}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-[1fr_80px_80px] gap-x-3 items-center">
                    <Label className="text-xs">Long description</Label>
                    <Input
                      type="number"
                      min={1}
                      value={icd10Config.longDescStart}
                      className="h-7 text-xs text-center"
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 1)
                          setIcd10Config((p) => ({ ...p, longDescStart: v }));
                      }}
                      disabled={importing}
                    />
                    <span className="text-[11px] text-center text-muted-foreground">to end</span>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={() => applyTxtConfig(icd10Config)}
                    disabled={importing}
                  >
                    Apply &amp; Re-parse
                  </Button>
                </div>
              )}
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
          {totalDataRows > 0 && !result && !importing && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {totalDataRows.toLocaleString()}
              </span>{" "}
              {fileFormat === "txt" && "rows detected from fixed-width file."}
              {fileFormat === "csv" && (
                <>
                  data rows detected. Columns:{" "}
                  <span className="font-mono text-xs">{headers.join(", ")}</span>
                </>
              )}
            </p>
          )}

          {/* ICD-10 parsed sample preview - 3 rows */}
          {importType === "icd10" && totalDataRows > 0 && !result && !importing && (
            <div className="rounded-md border border-border/50 bg-muted/20 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-foreground/80">
                Sample preview (first 3 rows):
              </p>
              <div className="rounded bg-background border border-border/40 divide-y divide-border/30 overflow-hidden">
                {(icd10TxtRows
                  ? icd10TxtRows.slice(0, 3)
                  : (parsedRows?.slice(0, 10).map(r => normalizeICD10Row(r, headers)).filter((r): r is ICD10Row => r !== null).slice(0, 3) ?? [])
                ).map((row, i) => (
                    <div key={i} className="px-2 py-1.5 text-[11px] grid grid-cols-2 gap-x-3">
                      <span className="truncate font-mono font-semibold text-primary">{row.code}</span>
                      <span className="truncate text-muted-foreground">{row.hippaCovered ? "HIPAA ✓" : ""}</span>
                      <span className="col-span-2 truncate">{row.shortDescription || row.description}</span>
                      {row.longDescription && <span className="col-span-2 truncate text-muted-foreground text-[10px]">{row.longDescription}</span>}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* RVS distribution preview - computed once over all rows */}
          {importType === "rvs" && totalDataRows > 0 && !result && !importing && parsedRows && (() => {
            const dist = { imaging: 0, laboratory: 0, heart_station: 0 } as Record<RVSProcedureType, number>;
            for (const r of parsedRows) {
              const row = normalizeRVSRow(r, headers);
              if (row?.procedureType && row.procedureType in dist) dist[row.procedureType]++;
            }
            return (
              <div className="rounded-md border border-border/50 bg-muted/20 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-foreground/80">Distribution by procedure type:</p>
                <div className="flex gap-2 flex-wrap">
                  {(["imaging", "laboratory", "heart_station"] as const).map((type) => (
                    <div key={type} className="rounded bg-background border border-border/40 px-3 py-1.5 text-center min-w-[100px]">
                      <p className="text-sm font-bold">{dist[type].toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{type.replace("_", " ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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
                  <p className="text-lg font-bold">{result.totalRows.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Rows</p>
                </div>
                <div className="rounded bg-background border border-border/50 px-2 py-2">
                  <p className="text-lg font-bold text-emerald-600">
                    {result.upserted.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Added / Updated</p>
                </div>
                <div className="rounded bg-background border border-border/50 px-2 py-2">
                  <p className="text-lg font-bold text-amber-600">
                    {result.deactivated.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Deactivated</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-destructive cursor-pointer">
                    {result.errors.length} row error(s) - click to expand
                  </summary>
                  <ul className="mt-1 max-h-28 overflow-y-auto text-[11px] text-muted-foreground space-y-0.5">
                    {result.errors.map((err, i) => (
                      <li key={i} className="truncate">
                        {err}
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
                onClick={() => { onOpenChange(false); reset(); }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => { onOpenChange(false); reset(); }}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={totalDataRows === 0 || importing}
                >
                  {importing ? "Importing..." : "Import"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
