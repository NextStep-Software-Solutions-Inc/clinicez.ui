"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  Database,
  FileSpreadsheet,
  Search,
  Shapes,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  KONSULTA_SAMPLE_LIBRARY_DEFINITIONS,
  getKonsultaCategoryLabel,
  getKonsultaStructureLabel,
  isSupportedKonsultaLibraryFile,
  parseKonsultaLibraryWorkbook,
  type KonsultaLibraryCategory,
  type KonsultaParsedSheet,
  type KonsultaParsedWorkbook,
} from "@/lib/konsulta-library";

const SUPPORTED_FILE_ACCEPT =
  ".xlsx,.xls,.xlsm,.xlsb,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function formatFileType(fileType: KonsultaParsedWorkbook["fileType"]): string {
  return fileType.toUpperCase();
}

function SheetPreviewTable({ sheet }: { sheet: KonsultaParsedSheet }) {
  const jsonPreview = JSON.stringify(sheet.previewRows, null, 2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">{sheet.sheetName}</CardTitle>
            <CardDescription>
              {sheet.rowCount} parsed row(s). Preview limited to the first 15 row(s).
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {getKonsultaStructureLabel(sheet.analysis.structure)}
            </Badge>
            {sheet.analysis.keyColumns.map((column) => (
              <Badge key={`${sheet.sheetName}-${column}`} variant="outline">
                Key: {column}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detected columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {sheet.analysis.columns.length > 0 ? (
                sheet.analysis.columns.map((column) => (
                  <div
                    key={`${sheet.sheetName}-${column.header}`}
                    className="rounded-md border p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{column.header}</span>
                      <Badge variant="outline">{column.role}</Badge>
                    </div>
                    <p className="mt-1 text-xs">
                      Samples:{" "}
                      {column.sampleValues.length > 0
                        ? column.sampleValues
                            .map((value) => String(value))
                            .join(", ")
                        : "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p>No column analysis available.</p>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sheet modeling notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Description columns:{" "}
                {sheet.analysis.descriptionColumns.length > 0
                  ? sheet.analysis.descriptionColumns.join(", ")
                  : "none detected"}
              </p>
              <p>
                Status columns:{" "}
                {sheet.analysis.statusColumns.length > 0
                  ? sheet.analysis.statusColumns.join(", ")
                  : "none detected"}
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {sheet.analysis.notes.map((note, noteIndex) => (
                  <li key={`${sheet.sheetName}-note-${noteIndex}`}>{note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {sheet.headers.map((header) => (
                  <TableHead key={header} className="whitespace-nowrap">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheet.previewRows.length > 0 ? (
                sheet.previewRows.map((row, rowIndex) => (
                  <TableRow key={`${sheet.sheetName}-${rowIndex}`}>
                    {sheet.headers.map((header) => (
                      <TableCell
                        key={`${sheet.sheetName}-${rowIndex}-${header}`}
                        className="align-top text-xs"
                      >
                        {row[header] === null ? "—" : String(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(sheet.headers.length, 1)}
                    className="text-center text-muted-foreground"
                  >
                    No preview rows available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">JSON preview</p>
          <Textarea
            readOnly
            value={jsonPreview}
            className="min-h-40 font-mono text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function WorkbookPreview({ workbook }: { workbook: KonsultaParsedWorkbook }) {
  const totalRows = workbook.sheets.reduce(
    (rowCount, sheet) => rowCount + sheet.rowCount,
    0,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                {workbook.analysis.title}
              </CardTitle>
              <CardDescription>{workbook.fileName}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formatFileType(workbook.fileType)}</Badge>
              <Badge variant="secondary">{workbook.sheetCount} sheet(s)</Badge>
              <Badge variant="secondary">{totalRows} parsed row(s)</Badge>
              <Badge>{getKonsultaCategoryLabel(workbook.analysis.category)}</Badge>
              <Badge variant="outline">
                {getKonsultaStructureLabel(workbook.analysis.structure)}
              </Badge>
              {workbook.sampleReference ? (
                <Badge variant="outline">Matched sample reference</Badge>
              ) : (
                <Badge variant="outline">Production upload</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">What this upload looks like</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {workbook.analysis.summary}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Where it likely integrates</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {workbook.analysis.clinicIntegration}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">How to use it later</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {workbook.analysis.suggestedUsage}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-primary" />
                  Suggested future modeling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  {workbook.analysis.modelingRecommendations.map(
                    (recommendation, recommendationIndex) => (
                      <li key={`${workbook.fileName}-model-${recommendationIndex}`}>
                        {recommendation}
                      </li>
                    ),
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shapes className="h-4 w-4 text-primary" />
                  Sample reference context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {workbook.sampleReference ? (
                  <>
                    <p>
                      This filename matches the sample reference catalog entry{" "}
                      <span className="font-medium text-foreground">
                        {workbook.sampleReference.title}
                      </span>
                      .
                    </p>
                    <p>{workbook.sampleReference.description}</p>
                  </>
                ) : (
                  <p>
                    No sample filename match was found, which is expected for production
                    uploads. The preview and inferred modeling guidance still work for
                    arbitrary admin-provided spreadsheets.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {workbook.warnings.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Parsing notes</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4 text-xs">
                  {workbook.warnings.map((warning, warningIndex) => (
                    <li key={`${workbook.fileName}-warning-${warningIndex}`}>
                      {warning}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {workbook.sheets.map((sheet) => (
        <SheetPreviewTable key={`${workbook.fileName}-${sheet.sheetName}`} sheet={sheet} />
      ))}
    </div>
  );
}

export function KonsultaLibrariesConsole() {
  const [parsedWorkbooks, setParsedWorkbooks] = useState<KonsultaParsedWorkbook[]>([]);
  const [activeWorkbook, setActiveWorkbook] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts: Record<KonsultaLibraryCategory, number> = {
      "clinical-reference": 0,
      "physical-exam": 0,
      immunization: 0,
      medication: 0,
      screening: 0,
    };

    KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.forEach((definition) => {
      counts[definition.category] += 1;
    });

    return counts;
  }, []);

  const activeWorkbookData =
    parsedWorkbooks.find((workbook) => workbook.fileName === activeWorkbook) ??
    parsedWorkbooks[0] ??
    null;

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
          "Upload at least one spreadsheet library file (.xlsx, .xls, .xlsm, .xlsb, or .csv).",
        );
        event.target.value = "";
        return;
      }

      if (workbookFiles.length !== selectedFiles.length) {
        toast.error(
          "Skipped unsupported files. Only spreadsheet library files are supported.",
        );
      }

      setIsParsing(true);

      const nextParsedWorkbooks = await Promise.all(
        workbookFiles.map((file) => parseKonsultaLibraryWorkbook(file)),
      );

      setParsedWorkbooks(nextParsedWorkbooks);
      setActiveWorkbook(nextParsedWorkbooks[0]?.fileName ?? "");

      const matchedSampleReferences = nextParsedWorkbooks.filter(
        (workbook) => workbook.sampleReference !== null,
      ).length;
      const workbookLabel =
        nextParsedWorkbooks.length === 1 ? "library file" : "library files";

      toast.success(
        `Parsed ${nextParsedWorkbooks.length} ${workbookLabel}. ${matchedSampleReferences} matched the sample reference catalog.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse the uploaded workbook.",
      );
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          PhilHealth Konsulta Libraries
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Upload real production library spreadsheets from admins, parse them
          client-side, preview the normalized rows, and review inferred future
          modeling guidance before any database design or persistence is added.
        </p>
      </div>

      <Alert>
        <Search className="h-4 w-4" />
        <AlertTitle>Production uploads are the source of truth</AlertTitle>
        <AlertDescription>
          The <span className="font-medium">LIBRARIES</span> folder is treated only as
          a sample reference catalog. This console supports arbitrary
          admin-provided spreadsheet files and does not require production
          filenames to match the sample kit.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload and analyze</TabsTrigger>
          <TabsTrigger value="catalog">Sample reference catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Upload production library files
              </CardTitle>
              <CardDescription>
                Accepts spreadsheet files from admins: .xlsx, .xls, .xlsm, .xlsb,
                and .csv.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept={SUPPORTED_FILE_ACCEPT}
                multiple
                onChange={(event) => void handleUpload(event)}
                disabled={isParsing}
              />
              <p className="text-xs text-muted-foreground">
                {isParsing
                  ? "Parsing library files..."
                  : "Preview stays in the browser only. No server upload, no DB writes, and no schema changes happen here."}
              </p>
            </CardContent>
          </Card>

          {parsedWorkbooks.length > 0 ? (
            <Tabs
              value={activeWorkbookData?.fileName ?? ""}
              onValueChange={setActiveWorkbook}
              className="space-y-4"
            >
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                {parsedWorkbooks.map((workbook) => (
                  <TabsTrigger
                    key={workbook.fileName}
                    value={workbook.fileName}
                    className="border data-[state=active]:border-primary"
                  >
                    {workbook.fileName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {parsedWorkbooks.map((workbook) => (
                <TabsContent
                  key={`${workbook.fileName}-content`}
                  value={workbook.fileName}
                  className="space-y-4"
                >
                  <WorkbookPreview workbook={workbook} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">No production library uploaded yet</p>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    Upload any production Konsulta spreadsheet library from the admin
                    source to inspect its structure, identify column roles, and decide
                    how it should be modeled later.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sample catalog only</AlertTitle>
            <AlertDescription>
              These entries summarize the sample files shipped with the Konsulta kit.
              They are helpful for comparison, but production imports can use different
              filenames and still be analyzed by the upload tab.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {(
              Object.keys(categoryCounts) as KonsultaLibraryCategory[]
            ).map((category) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {getKonsultaCategoryLabel(category)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{categoryCounts[category]}</p>
                  <p className="text-xs text-muted-foreground">sample workbook(s)</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sample Konsulta library reference</CardTitle>
              <CardDescription>
                This catalog summarizes the sample kit workbooks and where they appear
                to fit in clinic workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workbook</TableHead>
                      <TableHead>Library</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Clinic integration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {KONSULTA_SAMPLE_LIBRARY_DEFINITIONS.map((definition) => (
                      <TableRow key={definition.fileName}>
                        <TableCell className="font-mono text-xs">
                          {definition.fileName}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{definition.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {definition.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getKonsultaCategoryLabel(definition.category)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {definition.clinicIntegration}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
