"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Download, Filter } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportXLSX, XLSXExportData } from "@/lib/file-manipulation";
import { toast } from "sonner";
import { useOrganizationMembersReport } from "@/hooks/useOrganizationMembersReport";
import { useOrgColleges } from "@/hooks/useOrgCollege";
import { useOrgPrograms } from "@/hooks/useOrgProgram";
import { useOrgYearLevels } from "@/hooks/useOrgYearLevel";
import { OrganizationMembersReportRow } from "@actions/organizations/org-report.action";

const reportsFilterSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  gender: z.enum(["ALL", "MALE", "FEMALE"]).default("ALL"),
  collegeId: z.string().optional(),
  programId: z.string().optional(),
  yearLevelId: z.string().optional(),
});

export type OrganizationReportsFilterValues = z.infer<typeof reportsFilterSchema>;

interface OrganizationReportsFiltersProps {
  orgUid: string;
}

const GENDER_OPTIONS = [
  { value: "ALL", label: "All Genders" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

const DEFAULT_FILENAME = `organization_members_report_${format(new Date(), "yyyy-MM-dd")}`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "yyyy-MM-dd");
};

const generateAndExportOrganizationReport = async (
  rows: OrganizationMembersReportRow[] | null | undefined,
  filters: OrganizationReportsFilterValues
): Promise<number> => {
  const data = rows ?? [];

  const filtered = data.filter((row) => {
    const registeredDate = new Date(row.dateRegistered);
    const matchesDateRange =
      (!filters.startDate || registeredDate >= filters.startDate) &&
      (!filters.endDate || registeredDate <= filters.endDate);

    const matchesGender =
      filters.gender === "ALL" || !filters.gender || row.gender === filters.gender;

    const matchesCollege =
      !filters.collegeId || filters.collegeId === "ALL"
        ? true
        : String(row.college.id ?? "") === filters.collegeId;

    const matchesProgram =
      !filters.programId || filters.programId === "ALL"
        ? true
        : String(row.program.id ?? "") === filters.programId;

    const matchesYearLevel =
      !filters.yearLevelId || filters.yearLevelId === "ALL"
        ? true
        : String(row.yearLevel.id ?? "") === filters.yearLevelId;

    return (
      matchesDateRange &&
      matchesGender &&
      matchesCollege &&
      matchesProgram &&
      matchesYearLevel
    );
  });

  const xlsxData: XLSXExportData[] = filtered.map((row) => ({
    "First Name": row.firstName ?? "-",
    "Middle Name": row.middleName ?? "-",
    "Last Name": row.lastName ?? "-",
    Suffix: row.suffix ?? "-",
    Gender: row.gender ?? "-",
    Nationality: row.nationality ?? "-",
    Religion: row.religion ?? "-",
    Email: row.email ?? "-",
    Mobile: row.mobile ?? "-",
    Telephone: row.telephone ?? "-",
    Birthdate: formatDate(row.birthdate),
    "Place of Birth": row.placeOfBirth ?? "-",
    "Blood Type": row.bloodType ?? "-",
    "Civil Status": row.civilStatus ?? "-",
    Organization: row.organization.name ?? "-",
    College: row.college.name ?? "-",
    Program: row.program.name ?? "-",
    "Year Level": row.yearLevel.name ?? "-",
    "Date Registered": formatDate(row.dateRegistered),
  }));

  const columns = [
    "First Name",
    "Middle Name",
    "Last Name",
    "Suffix",
    "Gender",
    "Nationality",
    "Religion",
    "Email",
    "Mobile",
    "Telephone",
    "Birthdate",
    "Place of Birth",
    "Blood Type",
    "Civil Status",
    "Organization",
    "College",
    "Program",
    "Year Level",
    "Date Registered",
  ];

  exportXLSX(columns, xlsxData, {
    filename: DEFAULT_FILENAME,
    sheetName: "Members",
  });

  return filtered.length;
};

export const OrganizationReportsFilters = ({ orgUid }: OrganizationReportsFiltersProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Partial<OrganizationReportsFilterValues>
  >({});

  const form = useForm<OrganizationReportsFilterValues>({
    resolver: zodResolver(reportsFilterSchema),
    defaultValues: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      gender: "ALL",
      collegeId: "ALL",
      programId: "ALL",
      yearLevelId: "ALL",
    },
  });

  const { data: reportResponse, error: reportError } =
    useOrganizationMembersReport(orgUid);

  const rows = reportResponse?.data ?? [];

  const { data: colleges } = useOrgColleges(orgUid);
  const { data: programs } = useOrgPrograms(orgUid);
  const { data: yearLevels } = useOrgYearLevels(orgUid);

  const collegeOptions = useMemo(
    () =>
      [{ value: "ALL", label: "All Colleges" }].concat(
        (colleges ?? []).map((college) => ({
          value: String(college.id),
          label: college.name,
        }))
      ),
    [colleges]
  );

  const programOptions = useMemo(
    () =>
      [{ value: "ALL", label: "All Programs" }].concat(
        (programs ?? []).map((program) => ({
          value: String(program.id),
          label: program.name,
        }))
      ),
    [programs]
  );

  const yearLevelOptions = useMemo(
    () =>
      [{ value: "ALL", label: "All Year Levels" }].concat(
        (yearLevels ?? []).map((yearLevel) => ({
          value: String(yearLevel.id),
          label: yearLevel.name,
        }))
      ),
    [yearLevels]
  );

  const handleApplyFilters = (values: OrganizationReportsFilterValues) => {
    setActiveFilters(values);
    toast.success("Filters applied successfully");
  };

  const handleDownloadReport = async () => {
    if (reportError) {
      toast.error("Unable to download report at this time");
      return;
    }

    if (!rows.length) {
      toast.error("No data available for download");
      return;
    }

    setIsLoading(true);

    const downloadPromise = generateAndExportOrganizationReport(
      rows,
      form.getValues()
    );

    try {
      toast.promise(downloadPromise, {
        loading: "Preparing report for download...",
        success: (recordCount) => `Report downloaded successfully (${recordCount} records)`,
        error: "Failed to download report",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    form.reset();
    setActiveFilters({});
    toast.success("Filters cleared");
  };

  const getActiveFilterCount = () =>
    Object.entries(activeFilters).filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (key === "gender") return value !== "ALL";
      if (key === "collegeId" || key === "programId" || key === "yearLevelId") {
        return value !== "ALL";
      }
      return false;
    }).length;

  const disableDownload = isLoading || !rows.length || Boolean(reportError);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Organization Member Reports
        </CardTitle>
        <CardDescription>
          Filter and download comprehensive organization member reports.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleApplyFilters)} className="space-y-6">
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return (
                              date > new Date() ||
                              date < new Date("1900-01-01") ||
                              (startDate && date < startDate)
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collegeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>College</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collegeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearLevelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearLevelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Active filters:</span>
                <Badge variant="secondary">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? "s" : ""} applied
                </Badge>
              </div>
            )}
          </CardContent>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2">
                <Button type="submit" variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearFilters}
                  disabled={getActiveFilterCount() === 0}
                >
                  Clear Filters
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleDownloadReport}
                className="flex items-center gap-2"
                disabled={disableDownload}
              >
                <Download className="h-4 w-4" />
                {isLoading ? "Downloading..." : "Download Report"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
};
