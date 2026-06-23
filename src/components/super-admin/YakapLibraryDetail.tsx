"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as XLSX from "xlsx";
import { ArrowLeft, Upload, Save, X, Trash2, Edit2, Plus, RefreshCw, Columns } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getYakapLibraryById,
  saveYakapLibraryData,
  updateYakapLibrary,
  updateYakapLibraryColumns,
  appendYakapLibraryRows,
  updateYakapLibraryRow,
  deleteYakapLibraryRow,
  batchDeleteYakapLibraryRows,
  resetYakapLibrary
} from "@/actions/super-admin/yakap-library.action";
import { Textarea } from "../ui/textarea";

interface YakapLibraryDetailProps {
  libraryId: string;
  initialPage?: number;
  initialPageSize?: number;
}

export function YakapLibraryDetail({ libraryId, initialPage = 1, initialPageSize = 10 }: YakapLibraryDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [library, setLibrary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Library info state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Preview Mode (Excel Upload)
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [parsedColumns, setParsedColumns] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [previewEdits, setPreviewEdits] = useState<Record<number, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  // Define / Modify Columns Mode
  const [isDefineColsOpen, setIsDefineColsOpen] = useState(false);
  const [defineColsInput, setDefineColsInput] = useState<string[]>([]);

  // Add Row Manually Mode
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [addRowInput, setAddRowInput] = useState<Record<string, string>>({});

  // Existing Rows Management
  const [selectedExistingRows, setSelectedExistingRows] = useState<Set<string>>(new Set());
  const [existingRowEditMode, setExistingRowEditMode] = useState<string | null>(null);
  const [existingRowEditInput, setExistingRowEditInput] = useState<Record<string, string>>({});

  // Custom Alert Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Pagination State via Props / URL
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const currentPage = pageParam ? parseInt(pageParam, 10) : initialPage;
  const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : initialPageSize;

  const setPagination = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("pageSize", newPageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    fetchLibrary();
  }, [libraryId, currentPage, pageSize]);

  const fetchLibrary = async () => {
    setLoading(true);
    const res = await getYakapLibraryById(libraryId, currentPage, pageSize);
    if (res.status && res.data) {
      setLibrary(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || "");
    } else {
      toast.error(res.message);
    }
    setLoading(false);
    setSelectedExistingRows(new Set());
    setExistingRowEditMode(null);
  };

  const hasColumns = library?.columns && library.columns.length > 0;

  // -------------------------------------------------------------
  // Library Info Operations
  // -------------------------------------------------------------
  const handleSaveInfo = async () => {
    const res = await updateYakapLibrary(libraryId, { name: editName, description: editDesc });
    if (res.status) {
      toast.success("Library info updated.");
      setIsEditingInfo(false);
      fetchLibrary();
    } else {
      toast.error(res.message);
    }
  };

  const handleResetLibrary = async () => {
    setConfirmDialog({
      open: true,
      title: "Reset Library",
      description: "WARNING: This will permanently delete ALL rows and clear all columns. Are you completely sure you want to reset this library?",
      onConfirm: async () => {
        setLoading(true);
        const res = await resetYakapLibrary(libraryId);
        if (res.status) {
          toast.success("Library has been reset.");
          fetchLibrary();
        } else {
          toast.error(res.message);
          setLoading(false);
        }
      }
    });
  };

  // -------------------------------------------------------------
  // Excel Upload & Preview Operations
  // -------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (jsonData.length === 0) {
          toast.error("The uploaded Excel sheet is empty.");
          return;
        }

        let rawCols = Object.keys(jsonData[0] as object);
        rawCols = rawCols.filter(c => c.toLowerCase() !== 'legend');

        let colsToUse = rawCols;
        if (hasColumns) {
          // If appending, strictly filter to existing library columns
          colsToUse = library.columns.filter((c: string) => rawCols.includes(c));
        }

        const cleanedData = jsonData.map((row: any) => {
          const newRow: any = {};
          colsToUse.forEach(col => {
            newRow[col] = String(row[col] || "").trim();
          });
          return newRow;
        });

        setParsedColumns(colsToUse);
        setParsedData(cleanedData);
        setSelectedCols(new Set(colsToUse));
        setSelectedRows(new Set(cleanedData.map((_, i) => i)));
        setPreviewEdits({});
        setIsPreviewMode(true);
        toast.success(`Parsed ${cleanedData.length} rows successfully.`);
      } catch (error) {
        toast.error("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePreviewCellChange = (rowIndex: number, col: string, value: string) => {
    setPreviewEdits(prev => ({
      ...prev,
      [rowIndex]: {
        ...(prev[rowIndex] || {}),
        [col]: value
      }
    }));
  };

  const handleSavePreviewData = async () => {
    if (selectedRows.size === 0) {
      toast.error("No rows selected to save.");
      return;
    }
    setSaving(true);

    const activeCols = Array.from(selectedCols);
    const finalRows = Array.from(selectedRows).map(rowIndex => {
      const originalRow = parsedData[rowIndex];
      const edits = previewEdits[rowIndex] || {};
      const rowData: Record<string, string> = {};
      activeCols.forEach(col => {
        rowData[col] = edits[col] !== undefined ? edits[col] : originalRow[col];
      });
      return rowData;
    });

    let res;
    if (hasColumns) {
      res = await appendYakapLibraryRows(libraryId, finalRows);
    } else {
      res = await saveYakapLibraryData(libraryId, activeCols, finalRows);
    }

    setSaving(false);
    if (res.status) {
      toast.success(res.message);
      setIsPreviewMode(false);
      fetchLibrary();
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // Define/Modify Columns Operations
  // -------------------------------------------------------------
  const openDefineCols = () => {
    setDefineColsInput([...(library.columns || [])]);
    setIsDefineColsOpen(true);
  };

  const handleAddColInput = () => setDefineColsInput([...defineColsInput, ""]);
  
  const handleColInputChange = (index: number, value: string) => {
    const newCols = [...defineColsInput];
    newCols[index] = value;
    setDefineColsInput(newCols);
  };

  const handleRemoveColInput = (index: number) => {
    const newCols = [...defineColsInput];
    newCols.splice(index, 1);
    setDefineColsInput(newCols);
  };

  const handleSaveColumns = async () => {
    const cleaned = defineColsInput.map(c => c.trim()).filter(c => c);
    if (new Set(cleaned).size !== cleaned.length) {
      toast.error("Column names must be unique.");
      return;
    }
    const res = await updateYakapLibraryColumns(libraryId, cleaned);
    if (res.status) {
      toast.success("Columns updated successfully.");
      setIsDefineColsOpen(false);
      fetchLibrary();
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // Manually Add Row Operations
  // -------------------------------------------------------------
  const openAddRow = () => {
    const initial: Record<string, string> = {};
    library.columns.forEach((c: string) => initial[c] = "");
    setAddRowInput(initial);
    setIsAddRowOpen(true);
  };

  const handleSaveNewRow = async () => {
    const res = await appendYakapLibraryRows(libraryId, [addRowInput]);
    if (res.status) {
      toast.success("Row added successfully.");
      setIsAddRowOpen(false);
      fetchLibrary();
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // Existing Rows Management Operations
  // -------------------------------------------------------------
  const handleToggleExistingRow = (id: string, checked: boolean) => {
    const newSet = new Set(selectedExistingRows);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedExistingRows(newSet);
  };

  const handleSelectAllExisting = (checked: boolean) => {
    if (checked) {
      setSelectedExistingRows(new Set(library.Rows.map((r: any) => r.id)));
    } else {
      setSelectedExistingRows(new Set());
    }
  };

  const handleBatchDelete = async () => {
    setConfirmDialog({
      open: true,
      title: "Batch Delete",
      description: `Are you sure you want to delete ${selectedExistingRows.size} row(s)?`,
      onConfirm: async () => {
        setLoading(true);
        const res = await batchDeleteYakapLibraryRows(Array.from(selectedExistingRows));
        if (res.status) {
          toast.success(res.message);
          fetchLibrary();
        } else {
          toast.error(res.message);
          setLoading(false);
        }
      }
    });
  };

  const handleDeleteSingleRow = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Row",
      description: "Are you sure you want to delete this row?",
      onConfirm: async () => {
        const res = await deleteYakapLibraryRow(id);
        if (res.status) fetchLibrary();
        else toast.error(res.message);
      }
    });
  };

  const startEditingExistingRow = (row: any) => {
    setExistingRowEditMode(row.id);
    setExistingRowEditInput({ ...row.data });
  };

  const saveExistingRowEdit = async (id: string) => {
    const res = await updateYakapLibraryRow(id, existingRowEditInput);
    if (res.status) {
      toast.success("Row updated.");
      setExistingRowEditMode(null);
      fetchLibrary();
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  if (loading) return <div className="p-6">Loading library details...</div>;
  if (!library) return <div className="p-6 text-red-500">Library not found.</div>;

  return (
    <div className="space-y-6 mx-4">
      {/* Header section */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/super-admin/yakap-libraries")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {isEditingInfo ? (
            <div className="flex items-center space-x-2">
              <div className="flex flex-col space-y-2 w-full">
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Library Name" className="w-1/3 border-none font-bold text-2xl" />
                <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="border-none text-wrap text-muted-foreground text-md min-h-24" />
              </div>
              <Button size="sm" onClick={handleSaveInfo}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingInfo(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold tracking-tight">{library.name}</h2>
              <Badge variant={library.isActive ? "default" : "secondary"}>{library.isActive ? "Active" : "Inactive"}</Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)}>
                Edit Info
              </Button>
            </div>
          )}
          {!isEditingInfo && <p className="text-muted-foreground">{library.description || "No description provided."}</p>}
        </div>
        
        
      </div>
      <div className="flex justify-end mx-4">
        {/* Main Action Buttons */}
        {!isPreviewMode && (
          <div className="flex space-x-2">
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> {hasColumns ? "Append Excel" : "Upload Excel"}
            </Button>
            
            {hasColumns ? (
              <>
                <Button onClick={openAddRow} variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Row</Button>
                <Button onClick={openDefineCols} variant="outline"><Columns className="mr-2 h-4 w-4" /> Modify Columns</Button>
                <Button onClick={handleResetLibrary} variant="destructive"><RefreshCw className="mr-2 h-4 w-4" /> Reset Library</Button>
              </>
            ) : (
              <Button onClick={openDefineCols}><Columns className="mr-2 h-4 w-4" /> Define Columns</Button>
            )}
          </div>
        )}
      </div>

      {/* Preview Mode View */}
      {isPreviewMode ? (
        <div className="space-y-4 border rounded-md p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">Previewing Uploaded Data</h3>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsPreviewMode(false)} disabled={saving}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSavePreviewData} disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Confirm & Save Data"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Selected {selectedRows.size} of {parsedData.length} rows, and {selectedCols.size} of {parsedColumns.length} columns.
            You can edit cell values directly before saving.
          </p>

          <div className="max-h-[600px] overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedRows.size === parsedData.length && parsedData.length > 0} 
                      onCheckedChange={(c) => {
                        if (c) setSelectedRows(new Set(parsedData.map((_, i) => i)));
                        else setSelectedRows(new Set());
                      }}
                    />
                  </TableHead>
                  {parsedColumns.map(col => (
                    <TableHead key={col}>
                      <div className="flex items-center space-x-2">
                        {!hasColumns && (
                          <Checkbox 
                            checked={selectedCols.has(col)} 
                            onCheckedChange={(c) => {
                              const newSet = new Set(selectedCols);
                              if (c) newSet.add(col); else newSet.delete(col);
                              setSelectedCols(newSet);
                            }}
                          />
                        )}
                        <span>{col}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 50).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows.has(idx)}
                        onCheckedChange={(c) => {
                          const newSet = new Set(selectedRows);
                          if (c) newSet.add(idx); else newSet.delete(idx);
                          setSelectedRows(newSet);
                        }}
                      />
                    </TableCell>
                    {parsedColumns.map(col => {
                      const val = previewEdits[idx]?.[col] !== undefined ? previewEdits[idx][col] : row[col];
                      return (
                        <TableCell key={col}>
                          <Input 
                            value={val} 
                            onChange={(e) => handlePreviewCellChange(idx, col, e.target.value)} 
                            className="h-8 text-sm bg-transparent border-transparent hover:border-input focus:bg-background"
                            disabled={!selectedCols.has(col) || !selectedRows.has(idx)}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedData.length > 50 && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Showing first 50 rows for preview...
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Existing Rows View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Existing Rows ({library._count?.Rows || 0})</h3>
            {selectedExistingRows.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Batch Delete ({selectedExistingRows.size})
              </Button>
            )}
          </div>
          
          {hasColumns ? (
            <div className="max-h-[600px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={library.Rows.length > 0 && selectedExistingRows.size === library.Rows.length}
                        onCheckedChange={handleSelectAllExisting}
                      />
                    </TableHead>
                    {(library.columns as string[]).map((col: string) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {library.Rows?.map((row: any) => {
                    const isEditing = existingRowEditMode === row.id;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedExistingRows.has(row.id)}
                            onCheckedChange={(c) => handleToggleExistingRow(row.id, !!c)}
                          />
                        </TableCell>
                        {(library.columns as string[]).map((col: string) => (
                          <TableCell key={col}>
                            {isEditing ? (
                              <Input 
                                value={existingRowEditInput[col] || ""} 
                                onChange={e => setExistingRowEditInput({...existingRowEditInput, [col]: e.target.value})}
                                className="h-8"
                              />
                            ) : (
                              (row.data as any)[col]
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-right space-x-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => saveExistingRowEdit(row.id)}><Save className="h-4 w-4 text-green-600"/></Button>
                              <Button size="sm" variant="ghost" onClick={() => setExistingRowEditMode(null)}><X className="h-4 w-4"/></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => startEditingExistingRow(row)}><Edit2 className="h-4 w-4"/></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteSingleRow(row.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {library.Rows?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={library.columns.length + 2} className="text-center py-6 text-muted-foreground">
                        No rows found. Upload an Excel file or add rows manually.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              Columns are not defined yet. Please define columns or upload an initial Excel sheet.
            </div>
          )}
          
          {/* Pagination Controls */}
          {hasColumns && library._count?.Rows > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={pageSize.toString()} onValueChange={v => setPagination(1, Number(v))}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPagination(Math.max(1, currentPage - 1), pageSize)} disabled={currentPage === 1}>Previous</Button>
                <span className="text-sm">Page {currentPage} of {Math.ceil((library._count?.Rows || 0) / pageSize) || 1}</span>
                <Button variant="outline" size="sm" onClick={() => setPagination(Math.min(Math.ceil((library._count?.Rows || 0) / pageSize), currentPage + 1), pageSize)} disabled={currentPage === Math.ceil((library._count?.Rows || 0) / pageSize) || Math.ceil((library._count?.Rows || 0) / pageSize) === 0}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Define Columns Dialog */}
      <Dialog open={isDefineColsOpen} onOpenChange={setIsDefineColsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasColumns ? "Modify Columns" : "Define Columns"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto py-4">
            {defineColsInput.map((col, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Input value={col} onChange={e => handleColInputChange(idx, e.target.value)} placeholder={`Column ${idx + 1}`} />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveColInput(idx)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddColInput} className="w-full mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Column
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDefineColsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveColumns}>Save Columns</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Row Manually Dialog */}
      <Dialog open={isAddRowOpen} onOpenChange={setIsAddRowOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Row Manually</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-auto">
            {library?.columns?.map((col: string) => (
              <div key={col} className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">{col}</label>
                <Input 
                  value={addRowInput[col] || ""} 
                  onChange={e => setAddRowInput({...addRowInput, [col]: e.target.value})} 
                  className="col-span-3"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRowOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewRow}>Save Row</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Alert Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmDialog.onConfirm();
              setConfirmDialog(prev => ({ ...prev, open: false }));
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
