"use client";

import React, { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Microscope,
  Heart,
  Share2,
  FileText,
  Activity,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw,
  Printer,
  Building2,
  Pill,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import type { GetOrgReports } from "@/actions/organizations/org-reports.action";
import { getOrgReportsAction } from "@/actions/organizations/org-reports.action";
import {
  type ReportPeriod,
  REPORT_PERIOD_LABELS,
  getDateRangeForPeriod,
} from "@/lib/report-period-utils";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";

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

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* ──────────────────────────────────────── */
/*  Print section keys                       */
/* ──────────────────────────────────────── */
type PrintSections = {
  overview: boolean;
  clinics: boolean;
  appointments: boolean;
  consultations: boolean;
  members: boolean;
  diagnostics: boolean;
};

const ALL_PRINT_SECTIONS: PrintSections = {
  overview: true,
  clinics: true,
  appointments: true,
  consultations: true,
  members: true,
  diagnostics: true,
};

const PRINT_SECTION_LABELS: Record<keyof PrintSections, string> = {
  overview: "Overview (KPI summary)",
  clinics: "Clinics Breakdown",
  appointments: "Appointments",
  consultations: "Consultations",
  members: "Members",
  diagnostics: "Diagnostics & Documents",
};

/* ──────────────────────────────────────── */
/*  Build printable HTML report             */
/* ──────────────────────────────────────── */
function buildReportHtml(
  data: ReportData,
  periodLabel: string,
  sections: PrintSections
): string {
  const { org, period, appointments, consultations, patients, diagnostics, clinics, members } =
    data;
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
         <div class="kpi-box"><div class="kpi-label">Total Clinics</div><div class="kpi-value">${clinics.total}</div></div>
         <div class="kpi-box"><div class="kpi-label">Total Members</div><div class="kpi-value">${members.total}</div></div>
         <div class="kpi-box"><div class="kpi-label">Appointments</div><div class="kpi-value">${appointments.total}</div></div>
         <div class="kpi-box"><div class="kpi-label">Consultations</div><div class="kpi-value">${consultations.total}</div></div>
         <div class="kpi-box"><div class="kpi-label">New Patients</div><div class="kpi-value">${patients.newInPeriod}</div></div>
         <div class="kpi-box"><div class="kpi-label">Diagnostics</div><div class="kpi-value">${diagnostics.total}</div></div>
       </div>`
    : "";

  const clinicsSection = sections.clinics
    ? `<h2>Clinics Breakdown</h2>
       ${sectionTable(
         "Per-Clinic Activity",
         clinics.breakdown
           .map(
             (c) =>
               `<tr>
                <td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600">${c.name}</td>
                <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${c.appointments} appts</td>
                <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${c.consultations} consults</td>
                <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${c.patients} patients</td>
              </tr>`
           )
           .join("")
       )}`
    : "";

  const apptSection = sections.appointments
    ? `<h2>Appointments</h2>
       ${sectionTable(
         "By Status",
         appointments.byStatus
           .map((s) =>
             row(
               s.status,
               `${s.count} (${appointments.total > 0 ? Math.round((s.count / appointments.total) * 100) : 0}%)`
             )
           )
           .join("")
       )}
       ${sectionTable("By Mode", appointments.byMode.map((m) => row(m.mode, m.count)).join(""))}
       ${sectionTable("By Type", appointments.byType.map((t) => row(t.type, t.count)).join(""))}`
    : "";

  const consultSection = sections.consultations
    ? `<h2>Consultations</h2>
       ${sectionTable(
         "By Status",
         consultations.byStatus
           .map((s) =>
             row(
               s.status,
               `${s.count} (${consultations.total > 0 ? Math.round((s.count / consultations.total) * 100) : 0}%)`
             )
           )
           .join("")
       )}
       ${sectionTable("Top Healthcare Providers", consultations.byHP.map((h) => row(h.hp, h.count)).join(""))}`
    : "";

  const membersSection = sections.members
    ? `<h2>Members</h2>
       ${sectionTable("By Role", members.byRole.map((r) => row(r.role, r.count)).join(""))}`
    : "";

  const diagSection = sections.diagnostics
    ? `<h2>Diagnostics &amp; Documents</h2>
       ${sectionTable(
         "Summary",
         [
           row("Prescriptions", diagnostics.prescriptions),
           row("Lab Requests", diagnostics.labRequests),
           row("Imaging Requests", diagnostics.imagingRequests),
           row("Heart Station Requests", diagnostics.heartRequests),
           row("Medical Certificates", diagnostics.medicalCertificates),
           row("Referral Slips", diagnostics.referralSlips),
           row("Total Documents", diagnostics.total),
         ].join("")
       )}`
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
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
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
  ${clinicsSection}
  ${apptSection}
  ${consultSection}
  ${membersSection}
  ${diagSection}

  <div class="footer">This report was generated by ClinicEZ. Confidential — for authorized use only.</div>
</body>
</html>`;
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
  badge,
}: {
  label: string;
  count: number;
  total: number;
  badge?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[60%]">{label}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {badge}
            </Badge>
          )}
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
  if (!trend.length) {
    return (
      <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
        No data for this period
      </div>
    );
  }
  const maxVal = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {trend.map((t) => (
        <div
          key={t.date}
          className="flex-1 bg-primary/50 rounded-sm hover:bg-primary/70 transition-colors cursor-default"
          style={{ height: `${Math.max((t.count / maxVal) * 100, 4)}%` }}
          title={`${t.date}: ${t.count}`}
        />
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  CONFIRMED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  CANCELLED: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  PROCESSING: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  DONE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  UNKNOWN: "bg-muted text-muted-foreground",
};

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
          fromDate = new Date(from);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(to);
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

  const toggleSection = (key: keyof PrintSections) => {
    setPrintSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { org, clinics, members, appointments, consultations, patients, diagnostics } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
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
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="overflow-x-auto [&::-webkit-scrollbar]:hidden flex-nowrap w-full justify-start">
          <TabsTrigger value="overview" className="gap-1.5 whitespace-nowrap">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clinics" className="gap-1.5 whitespace-nowrap">
            <Building2 className="h-4 w-4" />
            Clinics
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 whitespace-nowrap">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="consultations" className="gap-1.5 whitespace-nowrap">
            <Stethoscope className="h-4 w-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 whitespace-nowrap">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="gap-1.5 whitespace-nowrap">
            <Activity className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              icon={<Building2 className="h-4 w-4 text-sky-600" />}
              label="Clinics"
              value={clinics.total}
              colorClass="bg-sky-500/10"
            />
            <KPICard
              icon={<Users className="h-4 w-4 text-violet-600" />}
              label="Members"
              value={members.total}
              colorClass="bg-violet-500/10"
            />
            <KPICard
              icon={<Calendar className="h-4 w-4 text-amber-600" />}
              label="Appointments"
              value={appointments.total}
              sub={`${appointments.walkIn} walk-in · ${appointments.scheduled} scheduled`}
              colorClass="bg-amber-500/10"
            />
            <KPICard
              icon={<Stethoscope className="h-4 w-4 text-emerald-600" />}
              label="Consultations"
              value={consultations.total}
              colorClass="bg-emerald-500/10"
            />
            <KPICard
              icon={<Users className="h-4 w-4 text-rose-600" />}
              label="New Patients"
              value={patients.newInPeriod}
              sub={`${patients.totalActive} total active`}
              colorClass="bg-rose-500/10"
            />
            <KPICard
              icon={<Activity className="h-4 w-4 text-indigo-600" />}
              label="Diagnostics"
              value={diagnostics.total}
              colorClass="bg-indigo-500/10"
            />
          </div>

          {/* Appointment + Consultation trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Appointment Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyTrendChart trend={appointments.dailyTrend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Consultation Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyTrendChart trend={consultations.dailyTrend} />
              </CardContent>
            </Card>
          </div>

          {/* Diagnostics summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Diagnostics &amp; Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Prescriptions", value: diagnostics.prescriptions, icon: <Pill className="h-3.5 w-3.5" /> },
                  { label: "Lab Requests", value: diagnostics.labRequests, icon: <FlaskConical className="h-3.5 w-3.5" /> },
                  { label: "Imaging", value: diagnostics.imagingRequests, icon: <Microscope className="h-3.5 w-3.5" /> },
                  { label: "Heart Station", value: diagnostics.heartRequests, icon: <Heart className="h-3.5 w-3.5" /> },
                  { label: "Med Certs", value: diagnostics.medicalCertificates, icon: <FileText className="h-3.5 w-3.5" /> },
                  { label: "Referrals", value: diagnostics.referralSlips, icon: <Share2 className="h-3.5 w-3.5" /> },
                ].map((d) => (
                  <div key={d.label} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {d.icon}
                      <span className="text-xs">{d.label}</span>
                    </div>
                    <div className="text-xl font-bold">{d.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CLINICS TAB ── */}
        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-500" />
                Clinic Performance ({clinics.total} clinics)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clinics.breakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clinics linked to this organization.</p>
              ) : (
                clinics.breakdown.map((c) => (
                  <div
                    key={c.clinicUid}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-xs text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">{c.appointments}</span> appts
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{c.consultations}</span> consults
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{c.patients}</span> patients
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── APPOINTMENTS TAB ── */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              icon={<Calendar className="h-4 w-4 text-amber-600" />}
              label="Total Appointments"
              value={appointments.total}
              colorClass="bg-amber-500/10"
            />
            <KPICard
              icon={<ClipboardList className="h-4 w-4 text-sky-600" />}
              label="Walk-in"
              value={appointments.walkIn}
              colorClass="bg-sky-500/10"
            />
            <KPICard
              icon={<Calendar className="h-4 w-4 text-violet-600" />}
              label="Scheduled"
              value={appointments.scheduled}
              colorClass="bg-violet-500/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments.byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <Badge
                      className={`text-xs ${STATUS_COLORS[s.status] ?? STATUS_COLORS.UNKNOWN}`}
                      variant="secondary"
                    >
                      {s.status}
                    </Badge>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))}
                {appointments.byStatus.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments.byMode.map((m) => (
                  <BreakdownRow
                    key={m.mode}
                    label={m.mode}
                    count={m.count}
                    total={appointments.total}
                  />
                ))}
                {appointments.byMode.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments.byType.map((t) => (
                  <BreakdownRow
                    key={t.type}
                    label={t.type}
                    count={t.count}
                    total={appointments.total}
                  />
                ))}
                {appointments.byType.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart trend={appointments.dailyTrend} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CONSULTATIONS TAB ── */}
        <TabsContent value="consultations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              icon={<Stethoscope className="h-4 w-4 text-emerald-600" />}
              label="Total Consultations"
              value={consultations.total}
              colorClass="bg-emerald-500/10"
            />
            <KPICard
              icon={<Users className="h-4 w-4 text-rose-600" />}
              label="New Patients (Period)"
              value={patients.newInPeriod}
              sub={`${patients.totalActive} total active`}
              colorClass="bg-rose-500/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultations.byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <Badge
                      className={`text-xs ${STATUS_COLORS[s.status] ?? STATUS_COLORS.UNKNOWN}`}
                      variant="secondary"
                    >
                      {s.status}
                    </Badge>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))}
                {consultations.byStatus.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Healthcare Providers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultations.byHP.map((h) => (
                  <BreakdownRow
                    key={h.hp}
                    label={h.hp}
                    count={h.count}
                    total={consultations.total}
                  />
                ))}
                {consultations.byHP.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Patient gender breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Patient Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patients.byGender.map((g) => (
                  <BreakdownRow
                    key={g.gender}
                    label={g.gender}
                    count={g.count}
                    total={patients.totalActive}
                  />
                ))}
                {patients.byGender.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Patient Age Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patients.byAgeGroup.map((a) => (
                  <BreakdownRow
                    key={a.group}
                    label={a.group === "Unknown" ? "Age unknown" : `${a.group} yrs`}
                    count={a.count}
                    total={patients.totalActive}
                  />
                ))}
                {patients.byAgeGroup.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart trend={consultations.dailyTrend} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MEMBERS TAB ── */}
        <TabsContent value="members" className="space-y-4">
          <KPICard
            icon={<Users className="h-4 w-4 text-violet-600" />}
            label="Active Members"
            value={members.total}
            colorClass="bg-violet-500/10"
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Members by Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.byRole.map((r) => (
                <BreakdownRow
                  key={r.role}
                  label={r.role}
                  count={r.count}
                  total={members.total}
                />
              ))}
              {members.byRole.length === 0 && (
                <p className="text-sm text-muted-foreground">No active members found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DIAGNOSTICS TAB ── */}
        <TabsContent value="diagnostics" className="space-y-4">
          <KPICard
            icon={<Activity className="h-4 w-4 text-indigo-600" />}
            label="Total Documents"
            value={diagnostics.total}
            colorClass="bg-indigo-500/10"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Prescriptions", value: diagnostics.prescriptions, icon: <Pill className="h-4 w-4 text-violet-600" />, color: "bg-violet-500/10" },
              { label: "Lab Requests", value: diagnostics.labRequests, icon: <FlaskConical className="h-4 w-4 text-sky-600" />, color: "bg-sky-500/10" },
              { label: "Imaging Requests", value: diagnostics.imagingRequests, icon: <Microscope className="h-4 w-4 text-teal-600" />, color: "bg-teal-500/10" },
              { label: "Heart Station", value: diagnostics.heartRequests, icon: <Heart className="h-4 w-4 text-rose-600" />, color: "bg-rose-500/10" },
              { label: "Medical Certificates", value: diagnostics.medicalCertificates, icon: <FileText className="h-4 w-4 text-amber-600" />, color: "bg-amber-500/10" },
              { label: "Referral Slips", value: diagnostics.referralSlips, icon: <Share2 className="h-4 w-4 text-emerald-600" />, color: "bg-emerald-500/10" },
            ].map((d) => (
              <KPICard
                key={d.label}
                icon={d.icon}
                label={d.label}
                value={d.value}
                colorClass={d.color}
              />
            ))}
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
