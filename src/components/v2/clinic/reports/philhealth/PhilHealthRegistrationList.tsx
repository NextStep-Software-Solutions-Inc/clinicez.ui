"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Search, Download, FileSpreadsheet, FileText, CheckSquare, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { extractRegistrationListAction, importRegistrationListToDbAction } from "@/actions/philhealth-yakap.actions";

interface PhilHealthRegistrationListProps {
  clinicUid: string;
}

type RegistrationEntry = {
  pAssignedPin: string;
  pAssignedLastName: string;
  pAssignedFirstName: string;
  pAssignedMiddleName: string;
  pAssignedExtName: string;
  pAssignedDateOfBirth: string;
  pAssignedSex: string;
  pAssignedType: string;
  pPrimaryPIN: string;
  pPrimaryLastName: string;
  pPrimaryFirstName: string;
  pPrimaryMiddleName: string;
  pPrimaryExtName: string;
  pPrimaryDateOfBirth: string;
  pPrimarySex: string;
  pMobileNumber: string;
  pLandlineNumber: string;
  pMemberNewCat: string;
  pMemberNewCatDesc: string;
  pPackageType: string;
  pAssignedDate: string;
  pAssignedStatus: string;
  pEffYear: string;
};

export default function PhilHealthRegistrationList({ clinicUid }: PhilHealthRegistrationListProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState<RegistrationEntry[]>([]);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [showRaw, setShowRaw] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{ imported: number; existing: number; error: number; errors: string[] } | null>(null);
  const pageSize = 100;
  const tableRef = useRef<HTMLTableElement>(null);
  const cancelImportRef = useRef(false);

  const handleExtract = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    startTransition(async () => {
      const result = await extractRegistrationListAction(clinicUid, startDate, endDate);
      if (result.status && result.data) {
        const data = result.data as { entries?: RegistrationEntry[]; raw?: string };
        setEntries(data.entries || []);
        setRawResponse(data.raw || null);
        setSelectedIndices(new Set());
        setCurrentPage(1);
        if (data.entries && data.entries.length > 0) {
          toast.success(`Extracted ${data.entries.length} records`);
        } else {
          toast.info("No records found or response is not in expected format");
        }
      } else {
        toast.error(result.message || "Failed to extract registration list");
        setRawResponse(result.message || "Error");
      }
    });
  };

  const isAllSelected = entries.length > 0 && selectedIndices.size === entries.length;
  const isSomeSelected = selectedIndices.size > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(entries.map((_, i) => i)));
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const getSelectedEntries = (): RegistrationEntry[] => {
    return entries.filter((_, i) => selectedIndices.has(i));
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const paginatedEntries = entries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportExcel = () => {
    const selected = getSelectedEntries();
    if (selected.length === 0) {
      toast.error("Please select at least one record to export");
      return;
    }

    const headers = [
      "PIN", "Last Name", "First Name", "Middle Name", "Ext", "DOB", "Sex", "Type",
      "Primary PIN", "Primary Last Name", "Primary First Name", "Primary Middle Name",
      "Mobile", "Category", "Category Desc", "Package", "Assigned Date", "Status", "Eff. Year"
    ];

    const rows = selected.map(e => [
      e.pAssignedPin, e.pAssignedLastName, e.pAssignedFirstName, e.pAssignedMiddleName,
      e.pAssignedExtName, e.pAssignedDateOfBirth, e.pAssignedSex, e.pAssignedType,
      e.pPrimaryPIN, e.pPrimaryLastName, e.pPrimaryFirstName, e.pPrimaryMiddleName,
      e.pMobileNumber, e.pMemberNewCat, e.pMemberNewCatDesc, e.pPackageType,
      e.pAssignedDate, e.pAssignedStatus === "1" ? "Active" : "Inactive", e.pEffYear
    ]);

    // Build CSV (Excel-compatible)
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PhilHealth_Registration_List_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} records to CSV`);
  };

  const handleImport = async () => {
    const selected = getSelectedEntries();
    if (selected.length === 0) {
      toast.error("Please select at least one record to import");
      return;
    }
    
    setImportSummary(null);
    setShowImportDialog(true);
    setIsImporting(true);
    setImportProgress(0);
    cancelImportRef.current = false;

    const summary = { imported: 0, existing: 0, error: 0, errors: [] as string[] };
    
    // Process in chunks of 5 for smoother progress bar updates
    const chunkSize = 5;
    for (let i = 0; i < selected.length; i += chunkSize) {
      if (cancelImportRef.current) {
        summary.errors.push("Import cancelled by user.");
        break;
      }
      
      const chunk = selected.slice(i, i + chunkSize);
      try {
        const result = await importRegistrationListToDbAction(clinicUid, chunk);
        if (result.status && result.summary) {
          summary.imported += result.summary.imported;
          summary.existing += result.summary.existing;
          summary.error += result.summary.error;
          summary.errors.push(...result.summary.errors);
        } else {
          summary.error += chunk.length;
          summary.errors.push(result.message || "Unknown error during chunk import");
        }
      } catch (e: any) {
        summary.error += chunk.length;
        summary.errors.push(e?.message || "Network error or server crash");
      }
      setImportProgress(Math.min(100, Math.round(((i + chunk.length) / selected.length) * 100)));
    }
    
    setImportSummary(summary);
    setIsImporting(false);
  };

  const handleExportPdf = () => {
    const selected = getSelectedEntries();
    if (selected.length === 0) {
      toast.error("Please select at least one record to export");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups for PDF export");
      return;
    }

    const tableHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>PhilHealth Registration List</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 9px; margin: 10px; }
    h2 { font-size: 14px; margin-bottom: 4px; }
    .subtitle { font-size: 10px; color: #666; margin-bottom: 12px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 3px 5px; text-align: left; white-space: nowrap; }
    th { background: #f0f0f0; font-weight: bold; font-size: 8px; }
    td { font-size: 8px; }
    tr:nth-child(even) { background: #fafafa; }
    .status-active { color: #16a34a; font-weight: bold; }
    .status-inactive { color: #dc2626; }
    @media print { body { margin: 5mm; } }
  </style>
</head>
<body>
  <h2>PhilHealth Yakap — Registration List</h2>
  <div class="subtitle">Date Range: ${startDate} to ${endDate} &bull; ${selected.length} records</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>PIN</th>
        <th>Last Name</th>
        <th>First Name</th>
        <th>Middle Name</th>
        <th>DOB</th>
        <th>Sex</th>
        <th>Type</th>
        <th>Primary PIN</th>
        <th>Primary Name</th>
        <th>Mobile</th>
        <th>Package</th>
        <th>Category</th>
        <th>Assigned</th>
        <th>Status</th>
        <th>Year</th>
      </tr>
    </thead>
    <tbody>
      ${selected.map((e, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${e.pAssignedPin}</td>
          <td>${e.pAssignedLastName}</td>
          <td>${e.pAssignedFirstName}</td>
          <td>${e.pAssignedMiddleName}</td>
          <td>${e.pAssignedDateOfBirth}</td>
          <td>${e.pAssignedSex}</td>
          <td>${e.pAssignedType}</td>
          <td>${e.pPrimaryPIN}</td>
          <td>${[e.pPrimaryLastName, e.pPrimaryFirstName].filter(Boolean).join(", ")}</td>
          <td>${e.pMobileNumber}</td>
          <td>${e.pPackageType}</td>
          <td>${e.pMemberNewCatDesc || e.pMemberNewCat}</td>
          <td>${e.pAssignedDate}</td>
          <td class="${e.pAssignedStatus === "1" ? "status-active" : "status-inactive"}">${e.pAssignedStatus === "1" ? "Active" : "Inactive"}</td>
          <td>${e.pEffYear}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    toast.success(`Preparing PDF for ${selected.length} records`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Registration List</h2>
        <p className="text-sm text-muted-foreground">Query patients registered to your facility within a date range</p>
      </div>

      {/* Query Controls */}
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex items-end gap-3">
            <div className="space-y-2 flex-1">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2 flex-1">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleExtract} disabled={isPending || !startDate || !endDate} className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Extract
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {entries.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">{entries.length} records found</p>
              {isSomeSelected && (
                <Badge variant="secondary" className="text-xs">
                  {selectedIndices.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-1.5 text-xs"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {isAllSelected ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={!isSomeSelected}
                className="gap-1.5 text-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={!isSomeSelected}
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={!isSomeSelected || isImporting}
                className="gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:border-emerald-800"
              >
                {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                Import to DB
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs text-muted-foreground"
              >
                {showRaw ? "Hide Raw" : "Show Raw"}
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-lg border overflow-auto max-h-[600px] custom-scrollbar">
            <table ref={tableRef} className="w-full min-w-[1100px]">
              <thead className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm border-b">
                <tr>
                  <th className="p-2 text-left w-10">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">#</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">PIN</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Name</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">DOB</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Sex</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Type</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Primary PIN</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Primary Name</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Mobile</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Pkg</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Category</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Assigned</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">Year</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry, idx) => {
                  const absoluteIndex = (currentPage - 1) * pageSize + idx;
                  return (
                  <tr
                    key={absoluteIndex}
                    className={`border-b last:border-b-0 transition-colors cursor-pointer ${
                      selectedIndices.has(absoluteIndex) ? "bg-teal-50/50 dark:bg-teal-950/20" : "hover:bg-muted/20"
                    }`}
                    onClick={() => toggleSelect(absoluteIndex)}
                  >
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIndices.has(absoluteIndex)}
                        onCheckedChange={() => toggleSelect(absoluteIndex)}
                      />
                    </td>
                    <td className="p-2 text-[11px] text-muted-foreground">{absoluteIndex + 1}</td>
                    <td className="p-2 text-[11px] font-mono">{entry.pAssignedPin}</td>
                    <td className="p-2 text-[11px] font-medium">
                      {[entry.pAssignedLastName, entry.pAssignedFirstName, entry.pAssignedMiddleName].filter(Boolean).join(", ")}
                      {entry.pAssignedExtName ? ` ${entry.pAssignedExtName}` : ""}
                    </td>
                    <td className="p-2 text-[11px]">{entry.pAssignedDateOfBirth}</td>
                    <td className="p-2 text-[11px]">{entry.pAssignedSex}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-[9px]">{entry.pAssignedType}</Badge>
                    </td>
                    <td className="p-2 text-[11px] font-mono">{entry.pPrimaryPIN}</td>
                    <td className="p-2 text-[11px]">
                      {[entry.pPrimaryLastName, entry.pPrimaryFirstName].filter(Boolean).join(", ")}
                    </td>
                    <td className="p-2 text-[11px]">{entry.pMobileNumber}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-[9px]">{entry.pPackageType}</Badge>
                    </td>
                    <td className="p-2 text-[11px]" title={entry.pMemberNewCatDesc}>
                      {entry.pMemberNewCatDesc || entry.pMemberNewCat}
                    </td>
                    <td className="p-2 text-[11px]">{entry.pAssignedDate}</td>
                    <td className="p-2">
                      <Badge
                        variant={entry.pAssignedStatus === "1" ? "default" : "secondary"}
                        className={`text-[9px] ${
                          entry.pAssignedStatus === "1"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                        }`}
                      >
                        {entry.pAssignedStatus === "1" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-2 text-[11px]">{entry.pEffYear}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, entries.length)} of {entries.length} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 text-sm font-medium">
                  {currentPage} <span className="text-muted-foreground">/ {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Raw Response (togglable) */}
      {rawResponse && showRaw && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium mb-2">Raw Response:</p>
            <pre className="text-[10px] font-mono bg-muted/50 p-3 rounded-lg max-h-64 overflow-auto whitespace-pre-wrap">
              {rawResponse}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no entries but raw exists */}
      {rawResponse && entries.length === 0 && !isPending && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Could not parse structured data from response. Raw response:</p>
            <pre className="text-[10px] font-mono bg-muted/50 p-3 rounded-lg max-h-64 overflow-auto whitespace-pre-wrap">
              {rawResponse}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        if (!open && !isImporting) setShowImportDialog(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importing Patients</DialogTitle>
            <DialogDescription>
              {isImporting ? "Please wait while we import the selected patients into your database." : "Import completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            {isImporting ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4 px-4">
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Processing records... {importProgress}%</p>
                <Progress 
                  value={importProgress} 
                  className="h-2 w-full max-w-xs bg-emerald-100 dark:bg-emerald-950" 
                  indicatorClassName="bg-emerald-600 dark:bg-emerald-500" 
                />
              </div>
            ) : importSummary ? (
              <div className="w-full space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{importSummary.imported}</p>
                    <p className="text-xs text-muted-foreground mt-1">Imported</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importSummary.existing}</p>
                    <p className="text-xs text-muted-foreground mt-1">Existing</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{importSummary.error}</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </div>
                </div>
                
                {importSummary.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-red-600 mb-2">Errors encountered:</p>
                    <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded text-[10px] text-red-800 dark:text-red-300 max-h-32 overflow-y-auto">
                      <ul className="list-disc pl-4 space-y-1">
                        {importSummary.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isImporting) {
                  cancelImportRef.current = true;
                } else {
                  setShowImportDialog(false);
                }
              }} 
            >
              {isImporting ? "Cancel Import" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
