"use client";

import React, { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw,
  Printer,
  UserCheck,
  UserX,
  Clock,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import type { GetOrgReports } from "@/actions/organizations/org-reports.action";
import { getOrgReportsAction } from "@/actions/organizations/org-reports.action";
import {
  type ReportPeriod,
  REPORT_PERIOD_LABELS,
  getDateRangeForPeriod,
} from "@/lib/report-period-utils";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";
import { exportXLSX, type XLSXExportData } from "@/lib/file-manipulation";
import { formatRequirementLabel } from "@/lib/requirement-types";

type ReportData = NonNullable<GetOrgReports["data"]>;

interface OrgReportsClientProps {
  orgUid: string;
  initialData: ReportData;
  initialPeriod?: string;
  initialFrom?: string;
  initialTo?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateStamp(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

function toInputDate(d: Date) {
  return dayjs(d).format("YYYY-MM-DD");
}

/* ──────────────────────────────────────── */
/*  Print section keys                       */
/* ──────────────────────────────────────── */
type PrintSections = {
  overview: boolean;
  memberInsights: boolean;
  students: boolean;
  staff: boolean;
};

const ALL_PRINT_SECTIONS: PrintSections = {
  overview: true,
  memberInsights: true,
  students: true,
  staff: true,
};

const PRINT_SECTION_LABELS: Record<keyof PrintSections, string> = {
  overview: "Overview (KPI summary)",
  memberInsights: "Member Insights",
  students: "Students",
  staff: "Staff",
};

/* ──────────────────────────────────────── */
/*  Build printable HTML report             */
/* ──────────────────────────────────────── */
function buildReportHtml(
  data: ReportData,
  periodLabel: string,
  sections: PrintSections
): string {
  const { org, period, members, students, staff } = data;
  const fromLabel = formatDate(period.from);
  const toLabel = formatDate(period.to);
  const generatedAt = new Date().toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const row = (label: string, value: string | number) =>
    `<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">${label}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-weight:600">${value}</td></tr>`;

  const sectionTable = (title: string, rows: string) =>
    `<div style="margin-bottom:20px;page-break-inside:avoid">
      <h3 style="font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;color:#374151">${title}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">${rows}</table>
    </div>`;

  const overviewSection = sections.overview
    ? `<h2>Overview</h2>
       <div class="kpi-grid">
         <div class="kpi-box"><div class="kpi-label">Active Members</div><div class="kpi-value">${members.totalActive}</div></div>
         <div class="kpi-box"><div class="kpi-label">New in Period</div><div class="kpi-value">${members.newInPeriod}</div></div>
         <div class="kpi-box"><div class="kpi-label">Pending Requests</div><div class="kpi-value">${members.pending}</div></div>
         <div class="kpi-box"><div class="kpi-label">Suspended</div><div class="kpi-value">${members.suspended}</div></div>
       </div>`
    : "";

  const memberSection = sections.memberInsights
    ? `<h2>Member Insights</h2>
       ${sectionTable("By Role", members.byRole.map((r) => row(r.role, r.count)).join(""))}
       ${sectionTable(
         "By Gender",
         members.byGender
           .map((g) =>
             row(
               g.gender,
               `${g.count} (${members.totalActive > 0 ? Math.round((g.count / members.totalActive) * 100) : 0}%)`
             )
           )
           .join("")
       )}
       ${sectionTable(
         "By Age Group",
         members.byAgeGroup
           .map((a) => row(a.group === "Unknown" ? "Age unknown" : `${a.group} yrs`, a.count))
           .join("")
       )}`
    : "";

  const studentsSection = sections.students
    ? `<h2>Students</h2>
       ${sectionTable("By College", students.byCollege.map((c) => row(c.college, c.count)).join(""))}
       ${sectionTable("By Program", students.byProgram.map((p) => row(p.program, p.count)).join(""))}
       ${sectionTable(
         "By Year Level",
         students.byYearLevel.map((y) => row(y.yearLevel, y.count)).join("")
       )}`
    : "";

  const staffSection = sections.staff
    ? `<h2>Staff</h2>
       ${sectionTable(
         "By Department",
         staff.byDepartment.map((d) => row(d.department, d.count)).join("")
       )}
       ${sectionTable("By Office", staff.byOffice.map((o) => row(o.office, o.count)).join(""))}`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Organization Report — ${org.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
    h2 { font-size: 15px; font-weight: 700; margin: 24px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; letter-spacing: .05em; color: #1f2937; }
    .header { margin-bottom: 28px; }
    .meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; }
    .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; }
    .kpi-value { font-size: 22px; font-weight: 700; margin-top: 4px; }
    .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${org.name} — Organization Report</h1>
    <p class="meta">Period: ${periodLabel} (${fromLabel} – ${toLabel})</p>
    <p class="meta">Generated: ${generatedAt}</p>
  </div>

  ${overviewSection}
  ${memberSection}
  ${studentsSection}
  ${staffSection}

  <div class="footer">This report was generated by ClinicEZ. Confidential — for authorized use only.</div>
</body>
</html>`;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildMemberFullName(member: ReportData["members"]["raw"][number]): string {
  const fullName = [member.firstName, member.middleName, member.lastName, member.suffix]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length))
    .join(" ");

  return fullName.length ? fullName : "Unknown";
}

function buildExcelRows(data: ReportData): { rows: XLSXExportData[]; requirementColumns: string[] } {
  const requirementColumnByKey: Record<string, string> = {};
  for (const member of data.members.raw) {
    for (const requirementKey of Object.keys(member.requirementsSubmitted)) {
      requirementColumnByKey[requirementKey] =
        requirementColumnByKey[requirementKey] ??
        `Requirement: ${formatRequirementLabel(requirementKey)} Submitted`;
    }
  }

  const requirementColumns = Object.values(requirementColumnByKey).sort((a, b) => a.localeCompare(b));
  const rows: XLSXExportData[] = [];

  for (const member of data.members.raw) {
    const requirementStatusColumns: Record<string, boolean> = {};
    for (const requirementKey of Object.keys(member.requirementsSubmitted)) {
      const columnName = requirementColumnByKey[requirementKey];
      requirementStatusColumns[columnName] = member.requirementsSubmitted[requirementKey];
    }

    rows.push({
      "Membership Status": member.status,
      "Accepted At": member.acceptedAt ? getDateStamp(new Date(member.acceptedAt)) : "-",
      Name: buildMemberFullName(member),
      Email: member.email ?? "-",
      Mobile: member.mobile ?? "-",
      Telephone: member.telephone ?? "-",
      "Civil Status": member.civilStatus ?? "-",
      "Blood Type": member.bloodType ?? "-",
      Nationality: member.nationality ?? "-",
      "Place of Birth": member.placeOfBirth ?? "-",
      Role: member.role,
      Gender: member.gender,
      "Age Group": member.ageGroup,
      Birthdate: member.birthdate ? getDateStamp(new Date(member.birthdate)) : "-",
      "Date Registered": getDateStamp(new Date(member.dateRegistered)),
      "Student Record - Student ID": member.studentRecord?.studentId ?? "-",
      "Student Record - LRN": member.studentRecord?.lrn ?? "-",
      "Student Record - Level": member.studentRecord?.level ?? "-",
      "Student Record - Year Level": member.studentRecord?.yearLevel ?? "-",
      "Student Record - Program": member.studentRecord?.program ?? "-",
      "Student Record - Department": member.studentRecord?.department ?? "-",
      "Student Record - College": member.studentRecord?.college ?? "-",
      "Employee Record - Employee ID": member.employeeRecord?.employeeId ?? "-",
      "Employee Record - Position": member.employeeRecord?.position ?? "-",
      "Employee Record - Designation": member.employeeRecord?.designation ?? "-",
      "Employee Record - Office": member.employeeRecord?.office ?? "-",
      "Employee Record - Department": member.employeeRecord?.department ?? "-",
      "Employee Record - College": member.employeeRecord?.college ?? "-",
      ...requirementStatusColumns,
    });
  }

  return { rows, requirementColumns };
}

/* ──────────────────────────────────────── */
/*  Sub-components                           */
/* ──────────────────────────────────────── */
function KPICard({
  icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <span className={`p-2 rounded-full ${colorClass ?? "bg-muted"}`}>{icon}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[65%]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{count}</span>
          <span className="text-muted-foreground text-xs w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DailyTrendChart({ trend }: { trend: { date: string; count: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  if (!trend.length) {
    return (
      <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
        No registrations in this period
      </div>
    );
  }
  const maxVal = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="relative flex items-end gap-0.5 h-16" aria-label="Daily registrations trend chart">
      {trend.map((t) => (
        <div
          key={t.date}
          className="flex-1 h-full flex flex-col justify-end group cursor-default"
          onMouseEnter={(e) => {
            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, date: t.date, count: t.count });
          }}
          onMouseMove={(e) => {
            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, date: t.date, count: t.count });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div
            className="w-full rounded-sm bg-primary/50 transition-colors group-hover:bg-primary/70"
            style={{ height: `${Math.max((t.count / maxVal) * 100, 4)}%` }}
          />
        </div>
      ))}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md space-y-0.5"
          style={{ left: tooltip.x + 12, top: Math.max(4, tooltip.y - 52) }}
        >
          <p>Date: {tooltip.date}</p>
          <p>Value: {tooltip.count}</p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────── */
/*  Main Client Component                   */
/* ──────────────────────────────────────── */
export function OrgReportsClient({
  orgUid,
  initialData,
  initialPeriod = "month",
  initialFrom,
  initialTo,
}: OrgReportsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<ReportData>(initialData);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [customFrom, setCustomFrom] = useState<string>(
    initialFrom ?? toInputDate(new Date(initialData.period.from))
  );
  const [customTo, setCustomTo] = useState<string>(
    initialTo ?? toInputDate(new Date(initialData.period.to))
  );
  const [isPending, startTransition] = useTransition();
  const [printOpen, setPrintOpen] = useState(false);
  const [printSections, setPrintSections] = useState<PrintSections>(ALL_PRINT_SECTIONS);

  const periodLabel =
    REPORT_PERIOD_LABELS[period as ReportPeriod] ??
    `${formatDate(data.period.from)} – ${formatDate(data.period.to)}`;

  const refresh = useCallback(
    (newPeriod: string, from?: string, to?: string) => {
      const params = new URLSearchParams({ period: newPeriod });
      if (newPeriod === "custom" && from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      router.replace(`?${params.toString()}`, { scroll: false });

      startTransition(async () => {
        let fromDate: Date;
        let toDate: Date;
        if (newPeriod === "custom" && from && to) {
          fromDate = new Date(from + "T00:00:00");
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(to + "T00:00:00");
          toDate.setHours(23, 59, 59, 999);
        } else {
          const range = getDateRangeForPeriod(newPeriod as ReportPeriod);
          fromDate = range.from;
          toDate = range.to;
        }

        const result = await getOrgReportsAction({ orgUid, from: fromDate, to: toDate });
        if (result.status && result.data) {
          setData(result.data);
        } else {
          toast.error(result.message ?? "Failed to refresh reports");
        }
      });
    },
    [orgUid, router]
  );

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== "custom") refresh(val);
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    refresh("custom", customFrom, customTo);
  };

  const handlePrint = () => {
    const html = buildReportHtml(data, periodLabel, printSections);
    handlePrintHtmlToPDF(html);
    setPrintOpen(false);
  };

  const handleDownloadExcel = async () => {
    const { rows, requirementColumns } = buildExcelRows(data);
    const columns = [
      "Membership Status",
      "Accepted At",
      "Name",
      "Email",
      "Mobile",
      "Telephone",
      "Civil Status",
      "Blood Type",
      "Nationality",
      "Place of Birth",
      "Role",
      "Gender",
      "Age Group",
      "Birthdate",
      "Date Registered",
      "Student Record - Student ID",
      "Student Record - LRN",
      "Student Record - Level",
      "Student Record - Year Level",
      "Student Record - Program",
      "Student Record - Department",
      "Student Record - College",
      "Employee Record - Employee ID",
      "Employee Record - Position",
      "Employee Record - Designation",
      "Employee Record - Office",
      "Employee Record - Department",
      "Employee Record - College",
      ...requirementColumns,
    ];
    const reportFrom = getDateStamp(new Date(data.period.from));
    const reportTo = getDateStamp(new Date(data.period.to));
    const filename = `organization_report_${sanitizeFilenamePart(data.org.name)}_${reportFrom}_to_${reportTo}`;

    try {
      await exportXLSX(columns, rows, {
        filename,
        sheetName: "Organization Report",
      });
      toast.success("Excel report downloaded");
    } catch (error) {
      console.error("Failed to download organization Excel report", error);
      toast.error("Failed to download Excel report. Please try again.");
    }
  };

  const toggleSection = (key: keyof PrintSections) => {
    setPrintSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { org, members, students, staff } = data;

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {org.name} · {periodLabel}
            <span className="ml-2 text-xs">
              ({formatDate(data.period.from)} – {formatDate(data.period.to)})
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_PERIOD_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 w-36 text-sm"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 w-36 text-sm"
              />
              <Button size="sm" variant="secondary" onClick={handleCustomApply}>
                Apply
              </Button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => refresh(period, customFrom, customTo)}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPrintOpen(true)}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadExcel}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="overflow-x-auto [&::-webkit-scrollbar]:hidden flex-nowrap w-full justify-start">
          <TabsTrigger value="overview" className="gap-1.5 whitespace-nowrap">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="memberInsights" className="gap-1.5 whitespace-nowrap">
            <Users className="h-4 w-4" />
            Member Insights
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5 whitespace-nowrap">
            <GraduationCap className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5 whitespace-nowrap">
            <Briefcase className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={<UserCheck className="h-4 w-4 text-emerald-600" />}
              label="Active Members"
              value={members.totalActive}
              colorClass="bg-emerald-500/10"
            />
            <KPICard
              icon={<TrendingUp className="h-4 w-4 text-sky-600" />}
              label="New in Period"
              value={members.newInPeriod}
              colorClass="bg-sky-500/10"
            />
            <KPICard
              icon={<Clock className="h-4 w-4 text-amber-600" />}
              label="Pending Requests"
              value={members.pending}
              colorClass="bg-amber-500/10"
            />
            <KPICard
              icon={<UserX className="h-4 w-4 text-rose-600" />}
              label="Suspended"
              value={members.suspended}
              colorClass="bg-rose-500/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-500" />
                  Members by Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.byRole.map((r) => (
                  <BreakdownRow
                    key={r.role}
                    label={r.role}
                    count={r.count}
                    total={members.totalActive}
                  />
                ))}
                {members.byRole.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active members</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-500" />
                  Members by Gender
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.byGender.map((g) => (
                  <BreakdownRow
                    key={g.gender}
                    label={g.gender}
                    count={g.count}
                    total={members.totalActive}
                  />
                ))}
                {members.byGender.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                New Registrations — Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart trend={members.registrationTrend} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MEMBER INSIGHTS TAB ── */}
        <TabsContent value="memberInsights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              icon={<UserCheck className="h-4 w-4 text-emerald-600" />}
              label="Active Members"
              value={members.totalActive}
              colorClass="bg-emerald-500/10"
            />
            <KPICard
              icon={<TrendingUp className="h-4 w-4 text-sky-600" />}
              label="New in Period"
              value={members.newInPeriod}
              colorClass="bg-sky-500/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.byRole.map((r) => (
                  <BreakdownRow
                    key={r.role}
                    label={r.role}
                    count={r.count}
                    total={members.totalActive}
                  />
                ))}
                {members.byRole.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Gender</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.byGender.map((g) => (
                  <BreakdownRow
                    key={g.gender}
                    label={g.gender}
                    count={g.count}
                    total={members.totalActive}
                  />
                ))}
                {members.byGender.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Age Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.byAgeGroup.map((a) => (
                  <BreakdownRow
                    key={a.group}
                    label={a.group === "Unknown" ? "Age unknown" : `${a.group} yrs`}
                    count={a.count}
                    total={members.totalActive}
                  />
                ))}
                {members.byAgeGroup.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Membership Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Active", value: members.totalActive, colorClass: "text-emerald-600", bg: "bg-emerald-500/10" },
                  { label: "New (period)", value: members.newInPeriod, colorClass: "text-sky-600", bg: "bg-sky-500/10" },
                  { label: "Pending", value: members.pending, colorClass: "text-amber-600", bg: "bg-amber-500/10" },
                  { label: "Suspended", value: members.suspended, colorClass: "text-rose-600", bg: "bg-rose-500/10" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-lg border p-3 ${s.bg}`}>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.colorClass}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                New Registrations — Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart trend={members.registrationTrend} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STUDENTS TAB ── */}
        <TabsContent value="students" className="space-y-4">
          <KPICard
            icon={<GraduationCap className="h-4 w-4 text-indigo-600" />}
            label="Student Records"
            value={students.total}
            colorClass="bg-indigo-500/10"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By College</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.byCollege.map((c) => (
                  <BreakdownRow
                    key={c.college}
                    label={c.college}
                    count={c.count}
                    total={students.total}
                  />
                ))}
                {students.byCollege.length === 0 && (
                  <p className="text-sm text-muted-foreground">No student records</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.byProgram.map((p) => (
                  <BreakdownRow
                    key={p.program}
                    label={p.program}
                    count={p.count}
                    total={students.total}
                  />
                ))}
                {students.byProgram.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Year Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.byYearLevel.map((y) => (
                  <BreakdownRow
                    key={y.yearLevel}
                    label={y.yearLevel}
                    count={y.count}
                    total={students.total}
                  />
                ))}
                {students.byYearLevel.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── STAFF TAB ── */}
        <TabsContent value="staff" className="space-y-4">
          <KPICard
            icon={<Briefcase className="h-4 w-4 text-teal-600" />}
            label="Employment Records"
            value={staff.total}
            colorClass="bg-teal-500/10"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Department</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {staff.byDepartment.map((d) => (
                  <BreakdownRow
                    key={d.department}
                    label={d.department}
                    count={d.count}
                    total={staff.total}
                  />
                ))}
                {staff.byDepartment.length === 0 && (
                  <p className="text-sm text-muted-foreground">No employment records</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Office</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {staff.byOffice.map((o) => (
                  <BreakdownRow
                    key={o.office}
                    label={o.office}
                    count={o.count}
                    total={staff.total}
                  />
                ))}
                {staff.byOffice.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Print / PDF Dialog ── */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print / Save as PDF</DialogTitle>
            <DialogDescription>
              Select the sections to include in the printed report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(Object.keys(ALL_PRINT_SECTIONS) as (keyof PrintSections)[]).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`section-${key}`}
                  checked={printSections[key]}
                  onCheckedChange={() => toggleSection(key)}
                />
                <Label htmlFor={`section-${key}`} className="cursor-pointer">
                  {PRINT_SECTION_LABELS[key]}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
