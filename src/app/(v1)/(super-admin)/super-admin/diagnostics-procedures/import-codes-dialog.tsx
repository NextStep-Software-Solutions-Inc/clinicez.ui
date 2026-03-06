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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  importICD10BatchAction,
  finalizeICD10ImportAction,
  importRVSProcedureBatchAction,
  finalizeRVSImportAction,
} from "@/actions/super-admin/import-medical-codes.action";
import type {
  ICD10Row,
  RVSProcedureRow,
  RVSProcedureType,
} from "@/actions/super-admin/import-medical-codes.action";

const BATCH_SIZE = 100;

type ImportType = "icd10" | "rvs";
type FileFormat = "txt" | "csv" | "pdf";

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

// ─── PDF text extraction (client-side via pdfjs-dist) ────────────────────────

interface TextItemLike {
  str?: string;
  transform?: number[];
}

async function extractPDFLines(file: File): Promise<string[]> {
  // Dynamic import keeps the bundle small. The worker is loaded from the
  // unpkg CDN pinned to the exact installed version — this is intentional
  // for a super-admin feature where internet access is expected.
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = [
    "https://unpkg.com/pdfjs-dist@",
    pdfjsLib.version,
    "/build/pdf.worker.min.mjs",
  ].join("");

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const byY = new Map<number, Array<{ str: string; x: number }>>();

    for (const raw of content.items) {
      const item = raw as TextItemLike;
      if (!item.str || !item.transform) continue;
      const y = Math.round(item.transform[5] / 2) * 2; // 2px tolerance: groups items on the same visual line
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ str: item.str, x: item.transform[4] });
    }

    // Higher Y = higher on page; sort descending
    for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
      const line = byY
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join("")
        .trim();
      if (line) allLines.push(line);
    }
  }
  return allLines;
}

// ─── RVS PDF column mapping ───────────────────────────────────────────────────

function splitToColumns(line: string, delimiter: string): string[] {
  if (delimiter === "auto") return line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
  if (delimiter === "tab")  return line.split("\t").map((s) => s.trim());
  return line.split(delimiter).map((s) => s.trim());
}

interface RVSColumnMap {
  nameCol: number;
  rvsCodeCol: number | null;
  categoryCol: number | null;
  descriptionCol: number | null;
}

const DEFAULT_COL_MAP: RVSColumnMap = {
  nameCol: 0,
  rvsCodeCol: 1,
  categoryCol: null,
  descriptionCol: null,
};

function mapPDFRows(
  lines: string[],
  delimiter: string,
  cm: RVSColumnMap
): RVSProcedureRow[] {
  return lines
    .map((line): RVSProcedureRow | null => {
      const cols = splitToColumns(line, delimiter);
      const name = cm.nameCol < cols.length ? (cols[cm.nameCol] ?? "").trim() : "";
      if (!name) return null;
      return {
        name,
        category:
          cm.categoryCol !== null && cm.categoryCol < cols.length
            ? (cols[cm.categoryCol] ?? "").trim()
            : "",
        rvsCode:
          cm.rvsCodeCol !== null && cm.rvsCodeCol < cols.length
            ? (cols[cm.rvsCodeCol] ?? "").trim() || undefined
            : undefined,
        description:
          cm.descriptionCol !== null && cm.descriptionCol < cols.length
            ? (cols[cm.descriptionCol] ?? "").trim() || undefined
            : undefined,
      };
    })
    .filter((r): r is RVSProcedureRow => r !== null);
}

/** Returns the column index (>= 0) or null if the value is empty, negative, or not a number. */
function parseColumnIndex(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) || n < 0 ? null : n;
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Dialog component ─────────────────────────────────────────────────────────

export function ImportCodesDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportCodesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [importType, setImportType] = useState<ImportType>("icd10");
  const [rvsType, setRvsType] = useState<RVSProcedureType>("imaging");
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

  // PDF state
  const [pdfLines, setPdfLines] = useState<string[] | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDelimiter, setPdfDelimiter] = useState("auto");
  const [colMap, setColMap] = useState<RVSColumnMap>(DEFAULT_COL_MAP);
  const [pdfMappedRows, setPdfMappedRows] = useState<RVSProcedureRow[] | null>(null);

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
    setPdfLines(null);
    setPdfMappedRows(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => {
    resetFileState();
    setProgress(0);
    setProgressLabel("");
    setResult(null);
    setColMap(DEFAULT_COL_MAP);
    setPdfDelimiter("auto");
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

  // Apply PDF column mapping
  const applyPdfMapping = (cm: RVSColumnMap = colMap, delim: string = pdfDelimiter) => {
    if (!pdfLines) return;
    const rows = mapPDFRows(pdfLines, delim, cm);
    setPdfMappedRows(rows);
    setParseError(rows.length === 0 ? "No rows mapped. Check column indices and delimiter." : null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetFileState();
    setResult(null);
    setFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    const fmt: FileFormat = ext === "txt" ? "txt" : ext === "pdf" ? "pdf" : "csv";
    setFileFormat(fmt);

    if (fmt === "pdf") {
      setPdfLoading(true);
      try {
        const lines = (await extractPDFLines(file)).filter((l) => l.trim());
        if (lines.length === 0) {
          setParseError("No text could be extracted from this PDF.");
          return;
        }
        setPdfLines(lines);
        const rows = mapPDFRows(lines, "auto", DEFAULT_COL_MAP);
        setPdfMappedRows(rows);
      } catch (err) {
        setParseError(
          `PDF extraction failed: ${err instanceof Error ? err.message : "Unknown error"}. ` +
            "Ensure the file is not password-protected."
        );
      } finally {
        setPdfLoading(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        if (fmt === "txt" && importType === "icd10") {
          setRawTxtContent(text);
          const rows = parseTXTWithConfig(text, icd10Config);
          if (rows.length === 0) {
            setParseError("No valid rows found. Check the file or adjust field positions below.");
          } else {
            setIcd10TxtRows(rows);
          }
        } else {
          const rows = parseCSV(text);
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
    const idx = (name: string) =>
      hdrs.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));
    const codeIdx = idx("code");
    const descIdx = idx("desc") !== -1 ? idx("desc") : idx("name");
    const catIdx  = idx("cat")  !== -1 ? idx("cat")  : idx("chapter");
    if (codeIdx === -1 || descIdx === -1) return null;
    return {
      code:        row[codeIdx] ?? "",
      description: row[descIdx] ?? "",
      category:    catIdx !== -1 ? (row[catIdx] ?? "") : undefined,
    };
  };

  const normalizeRVSRow = (row: string[], hdrs: string[]): RVSProcedureRow | null => {
    const idx = (name: string) =>
      hdrs.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));
    const nameIdx = idx("name")  !== -1 ? idx("name")  : idx("procedure");
    const catIdx  = idx("cat")   !== -1 ? idx("cat")   : idx("type");
    const rvsIdx  = idx("rvs")   !== -1 ? idx("rvs")   : idx("code");
    const descIdx = idx("desc");
    if (nameIdx === -1 || catIdx === -1) return null;
    return {
      name:        row[nameIdx] ?? "",
      category:    row[catIdx]  ?? "",
      rvsCode:     rvsIdx  !== -1 ? (row[rvsIdx]  ?? "") : undefined,
      description: descIdx !== -1 ? (row[descIdx] ?? "") : undefined,
    };
  };

  const totalDataRows =
    icd10TxtRows?.length ??
    pdfMappedRows?.length ??
    parsedRows?.length ??
    0;

  const handleImport = async () => {
    if (totalDataRows === 0) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    const errors: string[] = [];
    let totalUpserted = 0;

    if (importType === "icd10") {
      const allRows: ICD10Row[] = icd10TxtRows
        ? icd10TxtRows
        : (parsedRows ?? [])
            .map((r) => normalizeICD10Row(r, headers))
            .filter((r): r is ICD10Row => r !== null && r.code.trim() !== "");

      const importedCodes: string[] = [];
      const totalBatches = Math.ceil(allRows.length / BATCH_SIZE);
      const batchWeight = 90 / (totalBatches || 1);

      for (let b = 0; b < totalBatches; b++) {
        const slice = allRows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        importedCodes.push(...slice.map((r) => r.code.trim().toUpperCase()));
        setProgressLabel(`Processing batch ${b + 1} of ${totalBatches}...`);
        const batchResult = await importICD10BatchAction(slice);
        totalUpserted += batchResult.upserted;
        errors.push(...batchResult.errors);
        setProgress(Math.round((b + 1) * batchWeight));
      }

      setProgressLabel("Finalizing - deactivating removed codes...");
      const finalResult = await finalizeICD10ImportAction(importedCodes);
      setProgress(100);
      setProgressLabel("Import complete");
      setResult({
        totalRows: allRows.length,
        upserted: totalUpserted,
        deactivated: finalResult.deactivated,
        errors,
      });
    } else {
      const allRows: RVSProcedureRow[] = pdfMappedRows
        ? pdfMappedRows
        : (parsedRows ?? [])
            .map((r) => normalizeRVSRow(r, headers))
            .filter((r): r is RVSProcedureRow => r !== null && r.name.trim() !== "");

      const importedNames: string[] = [];
      const totalBatches = Math.ceil(allRows.length / BATCH_SIZE);
      const batchWeight = 90 / (totalBatches || 1);

      for (let b = 0; b < totalBatches; b++) {
        const slice = allRows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        importedNames.push(...slice.map((r) => r.name.trim()));
        setProgressLabel(`Processing batch ${b + 1} of ${totalBatches}...`);
        const batchResult = await importRVSProcedureBatchAction(rvsType, slice);
        totalUpserted += batchResult.upserted;
        errors.push(...batchResult.errors);
        setProgress(Math.round((b + 1) * batchWeight));
      }

      setProgressLabel("Finalizing - deactivating removed procedures...");
      const finalResult = await finalizeRVSImportAction(rvsType, importedNames);
      setProgress(100);
      setProgressLabel("Import complete");
      setResult({
        totalRows: allRows.length,
        upserted: totalUpserted,
        deactivated: finalResult.deactivated,
        errors,
      });
    }

    setImporting(false);
    toast.success("Import finished successfully");
    onImportComplete?.();
  };

  const icd10CsvHeaders = ["code", "description", "category"];
  const rvsHeaders      = ["name", "category", "rvsCode", "description"];
  const pdfPreviewLines = pdfLines?.slice(0, 8) ?? [];
  const pdfPreview      = pdfMappedRows?.slice(0, 3) ?? [];

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
          {/* Type / category selectors */}
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

            {importType === "rvs" && (
              <div>
                <Label className="text-xs mb-1 block">Procedure Category</Label>
                <Select
                  value={rvsType}
                  onValueChange={(v) => setRvsType(v as RVSProcedureType)}
                  disabled={importing}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="laboratory">Laboratory</SelectItem>
                    <SelectItem value="heart_station">Heart Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
                <p className="text-xs font-medium text-muted-foreground">Accepted formats:</p>
                <div className="space-y-1">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground/80">
                      PhilHealth RVS PDF
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Text is extracted automatically. Configure column mapping after upload.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground/80">CSV fallback</p>
                    <div className="flex gap-1 flex-wrap mt-0.5">
                      {rvsHeaders.map((h) => (
                        <Badge key={h} variant="secondary" className="text-[10px] font-mono">
                          {h}
                        </Badge>
                      ))}
                    </div>
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
                    : ".pdf,.csv,application/pdf,text/csv"
                }
                className="hidden"
                onChange={handleFileChange}
                disabled={importing}
              />
              <div
                className="border-2 border-dashed border-border/60 rounded-lg py-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                onClick={() => !importing && !pdfLoading && fileInputRef.current?.click()}
              >
                {pdfLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Extracting PDF text...</p>
                  </div>
                ) : fileName ? (
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
                        : "Click to select a PDF or CSV file"}
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

          {/* RVS PDF: column mapping */}
          {importType === "rvs" && fileFormat === "pdf" && pdfLines && !result && (
            <div className="rounded-md border border-border/50 p-3 space-y-3">
              <p className="text-xs font-semibold">PDF Column Mapping</p>

              <div>
                <p className="text-[11px] text-muted-foreground mb-1">
                  Extracted text preview (first {pdfPreviewLines.length} lines):
                </p>
                <div className="rounded bg-muted/30 border border-border/40 p-2 max-h-28 overflow-y-auto">
                  {pdfPreviewLines.map((line, i) => (
                    <p
                      key={i}
                      className="text-[11px] font-mono text-foreground/80 whitespace-pre truncate"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs shrink-0">Column delimiter:</Label>
                <Select
                  value={pdfDelimiter}
                  onValueChange={(v) => { setPdfDelimiter(v); applyPdfMapping(colMap, v); }}
                  disabled={importing}
                >
                  <SelectTrigger className="h-8 text-xs w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Multi-space (auto)</SelectItem>
                    <SelectItem value="tab">Tab</SelectItem>
                    <SelectItem value=",">Comma</SelectItem>
                    <SelectItem value="|">Pipe</SelectItem>
                    <SelectItem value=";">Semicolon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Assign a 0-based column index to each field. Set to empty or{" "}
                <span className="font-mono">-1</span> to skip optional fields.
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {(
                  [
                    { label: "Procedure Name *", field: "nameCol",        required: true  },
                    { label: "RVS Code",         field: "rvsCodeCol",     required: false },
                    { label: "Category",         field: "categoryCol",    required: false },
                    { label: "Description",      field: "descriptionCol", required: false },
                  ] as const
                ).map(({ label, field, required }) => (
                  <div key={field} className="flex items-center gap-2">
                    <Label className="text-xs w-36 shrink-0">{label}</Label>
                    <Input
                      type="number"
                      min={required ? 0 : -1}
                      placeholder={required ? "0" : "-1 = skip"}
                      value={colMap[field] ?? ""}
                      className="h-7 text-xs w-20 text-center"
                      onChange={(e) => {
                        const n = required
                          ? Math.max(0, parseInt(e.target.value, 10) || 0)
                          : parseColumnIndex(e.target.value);
                        setColMap((p) => ({ ...p, [field]: n }));
                      }}
                      disabled={importing}
                    />
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={() => applyPdfMapping()}
                disabled={importing}
              >
                Apply Mapping
              </Button>

              {pdfPreview.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    Mapped preview ({(pdfMappedRows?.length ?? 0).toLocaleString()} total rows):
                  </p>
                  <div className="rounded bg-muted/20 border border-border/40 divide-y divide-border/30">
                    {pdfPreview.map((row, i) => (
                      <div
                        key={i}
                        className="px-2 py-1.5 text-[11px] grid grid-cols-2 gap-x-3"
                      >
                        <span className="truncate">
                          <span className="text-muted-foreground">Name: </span>
                          {row.name}
                        </span>
                        <span className="truncate">
                          <span className="text-muted-foreground">RVS: </span>
                          {row.rvsCode ?? "N/A"}
                        </span>
                        <span className="truncate">
                          <span className="text-muted-foreground">Cat: </span>
                          {row.category || "N/A"}
                        </span>
                        <span className="truncate">
                          <span className="text-muted-foreground">Desc: </span>
                          {row.description ?? "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
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
              {fileFormat === "pdf" && "rows mapped from PDF."}
              {fileFormat === "csv" && (
                <>
                  data rows detected. Columns:{" "}
                  <span className="font-mono text-xs">{headers.join(", ")}</span>
                </>
              )}
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
                  disabled={totalDataRows === 0 || importing || pdfLoading}
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
