"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Search, Download, FileSpreadsheet, FileText, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { extractRegistrationListAction } from "@/actions/philhealth-yakap.actions";

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
  const pageSize = 100;
  const tableRef = useRef<HTMLTableElement>(null);

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
  <h2>PhilHealth Konsulta — Registration List</h2>
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
    </div>
  );
}
