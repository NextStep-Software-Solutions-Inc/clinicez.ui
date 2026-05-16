"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  CheckSquare,
  Database,
  FileSpreadsheet,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  KONSULTA_SAMPLE_LIBRARY_DEFINITIONS,
  getKonsultaCategoryLabel,
  getKonsultaStructureLabel,
  isSupportedKonsultaLibraryFile,
  parseKonsultaLibraryWorkbook,
  type KonsultaCellValue,
  type KonsultaLibraryCategory,
  type KonsultaLibraryDefinition,
  type KonsultaParsedRow,
  type KonsultaParsedWorkbook,
} from "@/lib/konsulta-library";

const SUPPORTED_FILE_ACCEPT =
  ".xlsx,.xls,.xlsm,.xlsb,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface LibraryRecord {
  id: string;
  values: KonsultaParsedRow;
  source: "import" | "manual";
  workbookName: string | null;
  sheetName: string | null;
}

interface LibraryManagerState {
  columns: string[];
  records: LibraryRecord[];
  selectedRecordIds: string[];
  uploadedWorkbooks: KonsultaParsedWorkbook[];
}

interface RowDialogState {
  mode: "create" | "edit";
  libraryKey: string;
  recordId: string | null;
}

interface DeleteDialogState {
  libraryKey: string;
  recordIds: string[];
}

type LibraryManagers = Record<string, LibraryManagerState>;
type RowDraft = Record<string, string>;

const DEFAULT_LIBRARY_COLUMNS: Record<KonsultaLibraryCategory, string[]> = {
  "clinical-reference": ["Code", "Description", "Status"],
  "physical-exam": ["Code", "Description", "Status"],
  immunization: ["Code", "Description", "Status"],
  medication: ["Code", "Description", "Form", "Strength", "Status"],
  screening: ["Code", "Description", "Group", "Status"],
};

function createInitialLibraryManagers(): LibraryManagers {
  return KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.reduce<LibraryManagers>(
    (managers, definition) => {
      managers[definition.fileName] = {
        columns: [],
        records: [],
        selectedRecordIds: [],
        uploadedWorkbooks: [],
      };
      return managers;
    },
    {},
  );
}

function createRecordId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatCellValue(value: KonsultaCellValue): string {
  if (value === null) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function toDraftValue(value: KonsultaCellValue): string {
  return value === null ? "" : String(value);
}

function mergeColumns(existingColumns: string[], nextColumns: string[]): string[] {
  return [...new Set([...existingColumns, ...nextColumns])];
}

function getLibraryColumns(
  definition: KonsultaLibraryDefinition,
  manager: LibraryManagerState,
): string[] {
  return manager.columns.length > 0
    ? manager.columns
    : DEFAULT_LIBRARY_COLUMNS[definition.category];
}

function createEmptyDraft(columns: string[]): RowDraft {
  return columns.reduce<RowDraft>((draft, column) => {
    draft[column] = "";
    return draft;
  }, {});
}

function buildDraftFromRecord(columns: string[], record: LibraryRecord): RowDraft {
  return columns.reduce<RowDraft>((draft, column) => {
    draft[column] = toDraftValue(record.values[column] ?? null);
    return draft;
  }, {});
}

function buildRowValues(columns: string[], draft: RowDraft): KonsultaParsedRow {
  return columns.reduce<KonsultaParsedRow>((values, column) => {
    const nextValue = draft[column]?.trim() ?? "";
    values[column] = nextValue.length > 0 ? nextValue : null;
    return values;
  }, {});
}

function isRowEmpty(values: KonsultaParsedRow): boolean {
  return Object.values(values).every((value) => value === null);
}

function flattenImportedRecords(workbooks: KonsultaParsedWorkbook[]): {
  importedColumns: string[];
  importedRecords: LibraryRecord[];
} {
  const importedColumns = workbooks.flatMap((workbook) =>
    workbook.sheets.flatMap((sheet) => sheet.headers),
  );
  const importedRecords = workbooks.flatMap((workbook) =>
    workbook.sheets.flatMap((sheet) =>
      sheet.rows.map((row) => ({
        id: createRecordId(),
        values: row,
        source: "import" as const,
        workbookName: workbook.fileName,
        sheetName: sheet.sheetName,
      })),
    ),
  );

  return { importedColumns, importedRecords };
}

function getLibraryDefinitionByKey(
  libraryKey: string,
): KonsultaLibraryDefinition | null {
  return (
    KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.find(
      (definition) => definition.fileName === libraryKey,
    ) ?? null
  );
}

export function KonsultaLibrariesConsole() {
  const [libraryManagers, setLibraryManagers] = useState<LibraryManagers>(
    createInitialLibraryManagers,
  );
  const [activeLibraryKey, setActiveLibraryKey] = useState(
    KONSULTA_SAMPLE_LIBRARY_DEFINITIONS[0]?.fileName ?? "",
  );
  const [rowDialogState, setRowDialogState] = useState<RowDialogState | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft>({});
  const [deleteDialogState, setDeleteDialogState] =
    useState<DeleteDialogState | null>(null);
  const [uploadingLibraryKey, setUploadingLibraryKey] = useState<string | null>(null);

  const librarySummary = useMemo(() => {
    const librariesWithRecords = Object.values(libraryManagers).filter(
      (manager) => manager.records.length > 0,
    ).length;
    const totalRecords = Object.values(libraryManagers).reduce(
      (count, manager) => count + manager.records.length,
      0,
    );
    const totalUploads = Object.values(libraryManagers).reduce(
      (count, manager) => count + manager.uploadedWorkbooks.length,
      0,
    );

    return {
      totalLibraries: KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.length,
      librariesWithRecords,
      totalRecords,
      totalUploads,
    };
  }, [libraryManagers]);

  const rowDialogColumns =
    rowDialogState === null
      ? []
      : (() => {
          const definition = getLibraryDefinitionByKey(rowDialogState.libraryKey);

          return definition
            ? getLibraryColumns(
                definition,
                libraryManagers[rowDialogState.libraryKey],
              )
            : [];
        })();

  const rowDialogRecord =
    rowDialogState?.mode === "edit" && rowDialogState.recordId !== null
      ? libraryManagers[rowDialogState.libraryKey].records.find(
          (record) => record.id === rowDialogState.recordId,
        ) ?? null
      : null;

  const setLibraryManager = (
    libraryKey: string,
    updater: (manager: LibraryManagerState) => LibraryManagerState,
  ) => {
    setLibraryManagers((currentManagers) => ({
      ...currentManagers,
      [libraryKey]: updater(currentManagers[libraryKey]),
    }));
  };

  const openCreateDialog = (definition: KonsultaLibraryDefinition) => {
    const manager = libraryManagers[definition.fileName];
    const columns = getLibraryColumns(definition, manager);
    setRowDialogState({
      mode: "create",
      libraryKey: definition.fileName,
      recordId: null,
    });
    setRowDraft(createEmptyDraft(columns));
  };

  const openEditDialog = (
    definition: KonsultaLibraryDefinition,
    record: LibraryRecord,
  ) => {
    const manager = libraryManagers[definition.fileName];
    const columns = getLibraryColumns(definition, manager);
    setRowDialogState({
      mode: "edit",
      libraryKey: definition.fileName,
      recordId: record.id,
    });
    setRowDraft(buildDraftFromRecord(columns, record));
  };

  const closeRowDialog = () => {
    setRowDialogState(null);
    setRowDraft({});
  };

  const handleUpload = async (
    libraryKey: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const selectedFiles = Array.from(event.target.files ?? []);

      if (selectedFiles.length === 0) {
        return;
      }

      const workbookFiles = selectedFiles.filter((file) =>
        isSupportedKonsultaLibraryFile(file.name),
      );

      if (workbookFiles.length === 0) {
        toast.error(
          "Please select at least one spreadsheet file (.xlsx, .xls, .xlsm, .xlsb, or .csv).",
        );
        return;
      }

      if (workbookFiles.length !== selectedFiles.length) {
        toast.error(
          "Skipped unsupported files. Only spreadsheet library files are accepted.",
        );
      }

      setUploadingLibraryKey(libraryKey);

      const parsedWorkbooks = await Promise.all(
        workbookFiles.map((file) => parseKonsultaLibraryWorkbook(file)),
      );
      const { importedColumns, importedRecords } =
        flattenImportedRecords(parsedWorkbooks);

      if (importedRecords.length === 0) {
        toast.error("The uploaded workbook has no rows to add to this library.");
        return;
      }

      setLibraryManager(libraryKey, (manager) => ({
        ...manager,
        columns: mergeColumns(manager.columns, importedColumns),
        records: [...manager.records, ...importedRecords],
        selectedRecordIds: [],
        uploadedWorkbooks: parsedWorkbooks,
      }));

      toast.success(
        `Imported ${importedRecords.length} row(s) into this library from ${parsedWorkbooks.length} workbook(s).`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to parse the uploaded workbook. Verify that the file is a valid spreadsheet and try again.",
      );
    } finally {
      setUploadingLibraryKey(null);
      event.target.value = "";
    }
  };

  const handleSaveRow = () => {
    if (rowDialogState === null) {
      return;
    }

    const definition = getLibraryDefinitionByKey(rowDialogState.libraryKey);

    if (!definition) {
      return;
    }

    const columns = getLibraryColumns(
      definition,
      libraryManagers[rowDialogState.libraryKey],
    );
    const rowValues = buildRowValues(columns, rowDraft);

    if (isRowEmpty(rowValues)) {
      toast.error("Add at least one value before saving this row.");
      return;
    }

    if (rowDialogState.mode === "create") {
      setLibraryManager(rowDialogState.libraryKey, (manager) => ({
        ...manager,
        columns: mergeColumns(manager.columns, columns),
        records: [
          {
            id: createRecordId(),
            values: rowValues,
            source: "manual",
            workbookName: null,
            sheetName: null,
          },
          ...manager.records,
        ],
      }));
      toast.success("Library row added.");
    } else if (rowDialogState.recordId !== null) {
      setLibraryManager(rowDialogState.libraryKey, (manager) => ({
        ...manager,
        columns: mergeColumns(manager.columns, columns),
        records: manager.records.map((record) =>
          record.id === rowDialogState.recordId
            ? { ...record, values: rowValues }
            : record,
        ),
      }));
      toast.success("Library row updated.");
    }

    closeRowDialog();
  };

  const confirmDelete = () => {
    if (deleteDialogState === null) {
      return;
    }

    setLibraryManager(deleteDialogState.libraryKey, (manager) => ({
      ...manager,
      records: manager.records.filter(
        (record) => !deleteDialogState.recordIds.includes(record.id),
      ),
      selectedRecordIds: manager.selectedRecordIds.filter(
        (recordId) => !deleteDialogState.recordIds.includes(recordId),
      ),
    }));

    toast.success(
      deleteDialogState.recordIds.length === 1
        ? "Library row deleted."
        : `Deleted ${deleteDialogState.recordIds.length} rows.`,
    );
    setDeleteDialogState(null);
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          PhilHealth Konsulta Libraries
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Manage each library in its own Super Admin tab with bulk Excel import,
          manual row entry, edit dialogs, single delete confirmation, and
          multi-select delete without saving to the database yet.
        </p>
      </div>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>Prototype-only library management</AlertTitle>
        <AlertDescription>
          This console simulates the future CRUD workflow in memory only. Uploads,
          adds, edits, and deletes stay in the browser and do not persist to the
          database yet.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Libraries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{librarySummary.totalLibraries}</p>
            <p className="text-xs text-muted-foreground">available library tabs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Managed tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {librarySummary.librariesWithRecords}
            </p>
            <p className="text-xs text-muted-foreground">
              libraries with imported or manual rows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Working rows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{librarySummary.totalRecords}</p>
            <p className="text-xs text-muted-foreground">
              in-memory rows across all libraries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upload batches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{librarySummary.totalUploads}</p>
            <p className="text-xs text-muted-foreground">
              parsed workbook batch previews
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeLibraryKey}
        onValueChange={setActiveLibraryKey}
        className="space-y-4"
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.map((definition) => {
            const manager = libraryManagers[definition.fileName];

            return (
              <TabsTrigger
                key={definition.fileName}
                value={definition.fileName}
                className="border data-[state=active]:border-primary"
              >
                <span>{definition.title}</span>
                {manager.records.length > 0 ? (
                  <Badge variant="secondary" className="ml-2">
                    {manager.records.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.map((definition) => {
          const manager = libraryManagers[definition.fileName];
          const columns = getLibraryColumns(definition, manager);
          const latestWorkbook = manager.uploadedWorkbooks[0] ?? null;
          const uploadWarnings = manager.uploadedWorkbooks.flatMap((workbook) =>
            workbook.warnings.map((warning) => `${workbook.fileName}: ${warning}`),
          );
          const allSelected =
            manager.records.length > 0 &&
            manager.selectedRecordIds.length === manager.records.length;
          const hasPartialSelection =
            manager.selectedRecordIds.length > 0 && !allSelected;

          return (
            <TabsContent
              key={definition.fileName}
              value={definition.fileName}
              className="space-y-4"
            >
              <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <FileSpreadsheet className="h-5 w-5 text-primary" />
                          {definition.title}
                        </CardTitle>
                        <CardDescription>{definition.description}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{getKonsultaCategoryLabel(definition.category)}</Badge>
                        <Badge variant="secondary">
                          {manager.records.length} working row(s)
                        </Badge>
                        <Badge variant="outline">
                          {manager.uploadedWorkbooks.length} upload batch(es)
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Clinic integration
                      </p>
                      <p>{definition.clinicIntegration}</p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Suggested usage</p>
                      <p>{definition.suggestedUsage}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Manage this library</CardTitle>
                    <CardDescription>
                      Upload Excel for bulk import or add individual rows manually.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${definition.fileName}-upload`}>
                        Bulk import spreadsheet
                      </Label>
                      <Input
                        id={`${definition.fileName}-upload`}
                        type="file"
                        accept={SUPPORTED_FILE_ACCEPT}
                        multiple
                        disabled={uploadingLibraryKey === definition.fileName}
                        onChange={(event) =>
                          void handleUpload(definition.fileName, event)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {uploadingLibraryKey === definition.fileName
                          ? "Parsing uploaded workbook..."
                          : "Accepted formats: .xlsx, .xls, .xlsm, .xlsb, and .csv."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openCreateDialog(definition)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add row
                      </Button>
                      <Button
                        variant="outline"
                        disabled={manager.selectedRecordIds.length === 0}
                        onClick={() =>
                          setDeleteDialogState({
                            libraryKey: definition.fileName,
                            recordIds: manager.selectedRecordIds,
                          })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete selected
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {latestWorkbook ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Latest upload</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {latestWorkbook.fileName}
                      </p>
                      <p>{latestWorkbook.analysis.summary}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Detected structure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">
                        {getKonsultaStructureLabel(
                          latestWorkbook.analysis.structure,
                        )}
                      </Badge>
                      <p>{latestWorkbook.analysis.suggestedUsage}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Modeling guidance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {latestWorkbook.analysis.modelingRecommendations
                        .slice(0, 2)
                        .map((recommendation) => (
                          <p key={recommendation}>{recommendation}</p>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {uploadWarnings.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import notes</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {uploadWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-lg">Working library rows</CardTitle>
                      <CardDescription>
                        Use checkboxes for multi-delete, or edit individual rows in
                        the dialog form.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {manager.records.length} total row(s)
                      </Badge>
                      <Badge variant="outline">
                        <CheckSquare className="mr-1 h-3 w-3" />
                        {manager.selectedRecordIds.length} selected
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                allSelected
                                  ? true
                                  : hasPartialSelection
                                    ? "indeterminate"
                                    : false
                              }
                              onCheckedChange={(checked) =>
                                setLibraryManager(definition.fileName, (current) => ({
                                  ...current,
                                  selectedRecordIds:
                                    checked === true
                                      ? current.records.map((record) => record.id)
                                      : [],
                                }))
                              }
                              aria-label={`Select all rows for ${definition.title}`}
                            />
                          </TableHead>
                          <TableHead>Source</TableHead>
                          {columns.map((column) => (
                            <TableHead key={`${definition.fileName}-${column}`}>
                              {column}
                            </TableHead>
                          ))}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manager.records.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length + 3}
                              className="py-10 text-center text-muted-foreground"
                            >
                              Upload a workbook or add a row manually to start managing
                              this library.
                            </TableCell>
                          </TableRow>
                        ) : (
                          manager.records.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                <Checkbox
                                  checked={manager.selectedRecordIds.includes(
                                    record.id,
                                  )}
                                  onCheckedChange={(checked) =>
                                    setLibraryManager(
                                      definition.fileName,
                                      (current) => ({
                                        ...current,
                                        selectedRecordIds:
                                          checked === true
                                            ? [
                                                ...current.selectedRecordIds,
                                                record.id,
                                              ]
                                            : current.selectedRecordIds.filter(
                                                (selectedId) =>
                                                  selectedId !== record.id,
                                              ),
                                      }),
                                    )
                                  }
                                  aria-label={`Select row ${record.id}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Badge
                                    variant={
                                      record.source === "import"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {record.source === "import"
                                      ? "Imported"
                                      : "Manual"}
                                  </Badge>
                                  {record.workbookName ? (
                                    <p className="text-xs text-muted-foreground">
                                      {record.workbookName}
                                      {record.sheetName
                                        ? ` • ${record.sheetName}`
                                        : ""}
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                              {columns.map((column) => (
                                <TableCell
                                  key={`${record.id}-${column}`}
                                  className="max-w-56 align-top text-sm"
                                >
                                  {formatCellValue(record.values[column] ?? null)}
                                </TableCell>
                              ))}
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(definition, record)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      setDeleteDialogState({
                                        libraryKey: definition.fileName,
                                        recordIds: [record.id],
                                      })
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={rowDialogState !== null} onOpenChange={closeRowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {rowDialogState?.mode === "edit" ? "Edit library row" : "Add library row"}
            </DialogTitle>
            <DialogDescription>
              {rowDialogState?.mode === "edit"
                ? "Update the selected library row in the browser-only working table."
                : "Create a manual library row for this tab without saving to the database yet."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {rowDialogColumns.map((column) => (
              <div key={column} className="space-y-2">
                <Label htmlFor={`row-field-${column}`}>{column}</Label>
                <Input
                  id={`row-field-${column}`}
                  value={rowDraft[column] ?? ""}
                  onChange={(event) =>
                    setRowDraft((currentDraft) => ({
                      ...currentDraft,
                      [column]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          {rowDialogRecord?.workbookName ? (
            <p className="text-xs text-muted-foreground">
              Original source: {rowDialogRecord.workbookName}
              {rowDialogRecord.sheetName ? ` • ${rowDialogRecord.sheetName}` : ""}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={closeRowDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveRow}>
              {rowDialogState?.mode === "edit" ? "Save changes" : "Add row"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected library row(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogState?.recordIds.length === 1
                ? "This removes the selected row from the in-memory working table."
                : "This removes all selected rows from the in-memory working table."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
