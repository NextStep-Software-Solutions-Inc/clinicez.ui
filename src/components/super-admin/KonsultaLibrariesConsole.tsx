"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { AlertCircle, FileSpreadsheet, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  KONSULTA_LIBRARY_DEFINITIONS,
  parseKonsultaLibraryWorkbook,
  type KonsultaLibraryCategory,
  type KonsultaParsedSheet,
  type KonsultaParsedWorkbook,
} from "@/lib/konsulta-library";

const CATEGORY_LABELS: Record<KonsultaLibraryCategory, string> = {
  "clinical-reference": "Clinical reference",
  "physical-exam": "Physical exam",
  immunization: "Immunization",
  medication: "Medication",
  screening: "Screening",
};

const CATEGORY_ENTRIES: Array<[KonsultaLibraryCategory, string]> = [
  ["clinical-reference", CATEGORY_LABELS["clinical-reference"]],
  ["physical-exam", CATEGORY_LABELS["physical-exam"]],
  ["immunization", CATEGORY_LABELS.immunization],
  ["medication", CATEGORY_LABELS.medication],
  ["screening", CATEGORY_LABELS.screening],
];

function SheetPreviewTable({ sheet }: { sheet: KonsultaParsedSheet }) {
  const jsonPreview = JSON.stringify(sheet.previewRows, null, 2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{sheet.sheetName}</CardTitle>
        <CardDescription>
          {sheet.rowCount} parsed row(s). Preview limited to the first 15 row(s).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                {workbook.definition?.title ?? workbook.fileName}
              </CardTitle>
              <CardDescription>{workbook.fileName}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{workbook.sheetCount} sheet(s)</Badge>
              <Badge variant="secondary">{totalRows} parsed row(s)</Badge>
              {workbook.definition ? (
                <Badge>{CATEGORY_LABELS[workbook.definition.category]}</Badge>
              ) : (
                <Badge variant="outline">Unmapped library</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {workbook.definition ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">What this data is</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {workbook.definition.description}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Where to integrate</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {workbook.definition.clinicIntegration}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">How to use later</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {workbook.definition.suggestedUsage}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unknown library mapping</AlertTitle>
              <AlertDescription>
                This workbook parsed successfully, but its filename is not part of the
                built-in Konsulta library catalog yet.
              </AlertDescription>
            </Alert>
          )}

          {workbook.warnings.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Parsing notes</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4 text-xs">
                  {workbook.warnings.map((warning, warningIndex) => (
                    <li key={`${workbook.fileName}-warning-${warningIndex}`}>{warning}</li>
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

    KONSULTA_LIBRARY_DEFINITIONS.forEach((definition) => {
      counts[definition.category] += 1;
    });

    return counts;
  }, []);

  const activeWorkbookData =
    parsedWorkbooks.find((workbook) => workbook.fileName === activeWorkbook) ??
    parsedWorkbooks[0] ??
    null;

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const workbookFiles = selectedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".xlsx"),
    );

    if (workbookFiles.length === 0) {
      toast.error("Upload at least one Konsulta .xlsx library file.");
      event.target.value = "";
      return;
    }

    if (workbookFiles.length !== selectedFiles.length) {
      toast.error("Skipped non-.xlsx files. Only Excel library files are supported.");
    }

    setIsParsing(true);

    try {
      const nextParsedWorkbooks = await Promise.all(
        workbookFiles.map((file) => parseKonsultaLibraryWorkbook(file)),
      );

      setParsedWorkbooks(nextParsedWorkbooks);
      setActiveWorkbook(nextParsedWorkbooks[0]?.fileName ?? "");

      const recognizedWorkbooks = nextParsedWorkbooks.filter(
        (workbook) => workbook.definition !== null,
      ).length;
      const workbookLabel =
        nextParsedWorkbooks.length === 1 ? "workbook" : "workbooks";

      toast.success(
        `Parsed ${nextParsedWorkbooks.length} ${workbookLabel}. ${recognizedWorkbooks} matched the built-in Konsulta catalog.`,
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
          Upload the PhilHealth Konsulta Excel libraries, parse them client-side,
          preview the normalized rows, and review where each library should
          integrate into clinic workflows before adding database models.
        </p>
      </div>

      <Alert>
        <Search className="h-4 w-4" />
        <AlertTitle>Analysis-only workflow</AlertTitle>
        <AlertDescription>
          This console does not write to the database yet. It is limited to upload,
          parse, preview, and integration analysis so the Konsulta datasets can be
          reviewed safely first.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload and preview</TabsTrigger>
          <TabsTrigger value="catalog">Bundled library catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Upload Konsulta Excel files
              </CardTitle>
              <CardDescription>
                Accepts one or more .xlsx library files from the Konsulta kit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                multiple
                onChange={(event) => void handleUpload(event)}
                disabled={isParsing}
              />
              <p className="text-xs text-muted-foreground">
                {isParsing
                  ? "Parsing workbooks..."
                  : "Preview stays in the browser only; no server upload or persistence happens here."}
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
                  <p className="font-medium">No library uploaded yet</p>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    Start with files such as lib_icd.xlsx, lib_medicine.xlsx, or
                    lib_ncdq.xlsx to inspect their structures and preview how they
                    fit clinic workflows.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {CATEGORY_ENTRIES.map(([category, label]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{categoryCounts[category]}</p>
                  <p className="text-xs text-muted-foreground">bundled workbook(s)</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Known Konsulta library mappings</CardTitle>
              <CardDescription>
                This catalog summarizes what each workbook appears to contain and
                where it should plug into clinic features later.
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
                    {KONSULTA_LIBRARY_DEFINITIONS.map((definition) => (
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
                        <TableCell>{CATEGORY_LABELS[definition.category]}</TableCell>
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
