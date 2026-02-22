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
  UserCheck,
  Droplets,
  ShieldAlert,
  Pill,
  PersonStanding,
  Wrench,
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
import type { GetClinicReports } from "@/actions/clinics/clinic-reports.action";
import { getClinicReportsAction } from "@/actions/clinics/clinic-reports.action";
import {
  type ReportPeriod,
  REPORT_PERIOD_LABELS,
  getDateRangeForPeriod,
} from "@/lib/report-period-utils";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";

type ReportData = NonNullable<GetClinicReports["data"]>;

interface ClinicReportsClientProps {
  clinicUid: string;
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
  appointments: boolean;
  consultations: boolean;
  patientInsights: boolean;
  diagnostics: boolean;
  staffActivity: boolean;
  serviceUtilization: boolean;
};

const ALL_PRINT_SECTIONS: PrintSections = {
  overview: true,
  appointments: true,
  consultations: true,
  patientInsights: true,
  diagnostics: true,
  staffActivity: true,
  serviceUtilization: true,
};

const PRINT_SECTION_LABELS: Record<keyof PrintSections, string> = {
  overview: "Overview (KPI summary)",
  appointments: "Appointments",
  consultations: "Consultations",
  patientInsights: "Patient Insights",
  diagnostics: "Diagnostics & Documents",
  staffActivity: "Staff Activity",
  serviceUtilization: "Service Utilization",
};

/* ──────────────────────────────────────── */
/*  Build printable HTML report             */
/* ──────────────────────────────────────── */
function buildReportHtml(data: ReportData, periodLabel: string, sections: PrintSections): string {
  const { clinic, period, appointments, consultations, patients, diagnostics, staff, services } = data;
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

  const appointmentStatusRows = appointments.byStatus
    .map((s) => row(s.status, `${s.count} (${appointments.total > 0 ? Math.round((s.count / appointments.total) * 100) : 0}%)`))
    .join("");

  const appointmentModeRows = appointments.byMode
    .map((m) => row(m.mode, m.count))
    .join("");

  const appointmentTypeRows = appointments.byType
    .map((t) => row(t.type, t.count))
    .join("");

  const topServicesRows = appointments.byService
    .map((s) => `<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">${s.service}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#6b7280;font-size:11px">${s.category}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-weight:600">${s.count}</td></tr>`)
    .join("");

  const consultationStatusRows = consultations.byStatus
    .map((s) => row(s.status, `${s.count} (${consultations.total > 0 ? Math.round((s.count / consultations.total) * 100) : 0}%)`))
    .join("");

  const hpRows = consultations.byHP
    .map((h) => row(h.hp, h.count))
    .join("");

  // Patient insights rows
  const genderRows = patients.byGender.map((g) => row(g.gender, `${g.count} (${patients.totalActive > 0 ? Math.round((g.count / patients.totalActive) * 100) : 0}%)`)).join("");
  const ageGroupRows = patients.byAgeGroup.map((a) => row(a.group === "Unknown" ? "Age unknown" : `${a.group} yrs`, a.count)).join("");
  const civilStatusRows = patients.byCivilStatus.map((c) => row(c.status, c.count)).join("");
  const bloodTypeRows = patients.byBloodType.map((b) => row(b.type.replace("_", " "), b.count)).join("");
  const conditionRows = patients.topConditions.map((c) => row(c.condition, c.count)).join("");
  const allergyRows = patients.topAllergies.map((a) => row(a.allergen, a.count)).join("");
  const profileRows = patients.byProfileCompletion.map((p) => row(p.status, p.count)).join("");

  // Staff activity rows
  const memberRoleRows = staff.byRole.map((r) => row(r.role, r.count)).join("");
  const hpActivityRows = staff.hpActivity.map((hp) =>
    `<tr>
      <td style="padding:4px 8px;border:1px solid #e5e7eb">${hp.name}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${hp.consultations}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${hp.prescriptions}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${hp.labRequests}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${hp.imagingRequests}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right">${hp.medicalCertificates}</td>
    </tr>`
  ).join("");

  // Services rows
  const procedureTypeRows = services.byType.map((t) => row(t.type, t.count)).join("");
  const topProcedureRows = services.topProcedures.map((p) => `<tr><td style="padding:4px 8px;border:1px solid #e5e7eb">${p.name}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;color:#6b7280;font-size:11px">${p.type}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-weight:600">${p.count}</td></tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Clinic Report — ${clinic.name}</title>
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
    .kpi-value { font-size: 22px; font-weight: 700; margin-top: 2px; }
    .kpi-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .diag-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .diag-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; }
    .diag-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; }
    .diag-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
    footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #9ca3af; }
    @media print {
      @page { margin: 1.5cm; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${clinic.name} — Clinic Report</h1>
    <p class="meta">Period: <strong>${periodLabel}</strong> &nbsp;|&nbsp; ${fromLabel} – ${toLabel}</p>
    <p class="meta">Generated: ${generatedAt}</p>
  </div>

  ${sections.overview ? `<h2>Overview</h2>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Appointments</div>
      <div class="kpi-value">${appointments.total}</div>
      <div class="kpi-sub">${appointments.scheduled} scheduled · ${appointments.walkIn} walk-in</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Consultations</div>
      <div class="kpi-value">${consultations.total}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">New Patients</div>
      <div class="kpi-value">${patients.newInPeriod}</div>
      <div class="kpi-sub">${patients.totalActive} total active</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Diagnostics Issued</div>
      <div class="kpi-value">${diagnostics.total}</div>
    </div>
  </div>` : ""}

  ${sections.appointments ? `<h2>Appointments</h2>
  <div class="two-col">
    ${sectionTable("By Status", appointmentStatusRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("By Mode", appointmentModeRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("By Type", appointmentTypeRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${appointments.byService.length > 0 ? `<div style="margin-bottom:20px;page-break-inside:avoid">
      <h3 style="font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;color:#374151">Top Services Availed</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr>
          <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb">Service</th>
          <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb">Category</th>
          <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Count</th>
        </tr></thead>
        <tbody>${topServicesRows}</tbody>
      </table>
    </div>` : ""}
  </div>` : ""}

  ${sections.consultations ? `<h2>Consultations</h2>
  <div class="two-col">
    ${sectionTable("By Status", consultationStatusRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("By Healthcare Provider", hpRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
  </div>` : ""}

  ${sections.patientInsights ? `<h2>Patient Insights</h2>
  <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
    <div class="kpi-box"><div class="kpi-label">New Registrations (Period)</div><div class="kpi-value">${patients.newInPeriod}</div></div>
    <div class="kpi-box"><div class="kpi-label">Total Active Patients</div><div class="kpi-value">${patients.totalActive}</div></div>
  </div>
  <div class="three-col">
    ${sectionTable("Gender", genderRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("Age Groups", ageGroupRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("Civil Status", civilStatusRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
  </div>
  <div class="two-col">
    ${sectionTable("Blood Type", bloodTypeRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("Profile Completion", profileRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${sectionTable("Top Health Conditions", conditionRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No recorded conditions</td></tr>")}
    ${sectionTable("Top Allergies", allergyRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No recorded allergies</td></tr>")}
  </div>` : ""}

  ${sections.diagnostics ? `<h2>Diagnostics &amp; Documents</h2>
  <div class="diag-grid">
    <div class="diag-box"><div class="diag-label">Prescriptions</div><div class="diag-value">${diagnostics.prescriptions}</div></div>
    <div class="diag-box"><div class="diag-label">Lab Requests</div><div class="diag-value">${diagnostics.labRequests}</div></div>
    <div class="diag-box"><div class="diag-label">Imaging Requests</div><div class="diag-value">${diagnostics.imagingRequests}</div></div>
    <div class="diag-box"><div class="diag-label">Heart Station</div><div class="diag-value">${diagnostics.heartRequests}</div></div>
    <div class="diag-box"><div class="diag-label">Medical Certificates</div><div class="diag-value">${diagnostics.medicalCertificates}</div></div>
    <div class="diag-box"><div class="diag-label">Referral Slips</div><div class="diag-value">${diagnostics.referralSlips}</div></div>
  </div>` : ""}

  ${sections.staffActivity ? `<h2>Staff Activity</h2>
  <div class="two-col" style="margin-bottom:16px">
    ${sectionTable("Members by Role", memberRoleRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
  </div>
  ${staff.hpActivity.length > 0 ? `<div style="margin-bottom:24px;page-break-inside:avoid">
    <h3 style="font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;color:#374151">Healthcare Provider Activity</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr>
        <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb">Provider</th>
        <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Consults</th>
        <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Rx</th>
        <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Lab</th>
        <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Imaging</th>
        <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Med Certs</th>
      </tr></thead>
      <tbody>${hpActivityRows}</tbody>
    </table>
  </div>` : ""}` : ""}

  ${sections.serviceUtilization ? `<h2>Service Utilization</h2>
  <div class="two-col">
    ${sectionTable("By Procedure Type", procedureTypeRows || "<tr><td colspan='2' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
    ${services.topProcedures.length > 0 ? `<div style="margin-bottom:20px;page-break-inside:avoid">
      <h3 style="font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;color:#374151">Top Procedures</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr>
          <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb">Procedure</th>
          <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb">Type</th>
          <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;background:#f9fafb">Count</th>
        </tr></thead>
        <tbody>${topProcedureRows}</tbody>
      </table>
    </div>` : sectionTable("Top Procedures", "<tr><td colspan='3' style='padding:6px 8px;color:#9ca3af'>No data</td></tr>")}
  </div>` : ""}

  <footer>
    This report was generated automatically by ClinicEZ for ${clinic.name}.
    Period: ${fromLabel} – ${toLabel} · Generated: ${generatedAt}
  </footer>
</body>
</html>`;
}

/* ──────────────────────────────────────── */
/*  KPI Card                                */
/* ──────────────────────────────────────── */
function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: color ? `${color}20` : "hsl(var(--primary) / 0.1)" }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: color ?? "hsl(var(--primary))" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────── */
/*  Breakdown list row                      */
/* ──────────────────────────────────────── */
function BreakdownRow({
  label,
  count,
  total,
  badgeVariant,
}: {
  label: string;
  count: number;
  total: number;
  badgeVariant?: "default" | "secondary" | "outline";
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm truncate">{label}</span>
          <span className="text-sm font-semibold tabular-nums ml-2 flex-shrink-0">
            {count}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/70 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Badge variant={badgeVariant ?? "secondary"} className="text-xs flex-shrink-0 w-12 justify-center">
        {pct}%
      </Badge>
    </div>
  );
}

/* ──────────────────────────────────────── */
/*  Mini bar chart                          */
/* ──────────────────────────────────────── */
function DailyTrendChart({
  data,
  color,
}: {
  data: { date: string; count: number }[];
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-20" aria-label="Daily trend chart">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 min-w-0 flex flex-col items-center gap-0.5 group"
          title={`${d.date}: ${d.count}`}
        >
          <div
            className="w-full rounded-sm transition-all group-hover:opacity-80"
            style={{
              height: `${(d.count / max) * 100}%`,
              backgroundColor: color ?? "hsl(var(--primary) / 0.6)",
              minHeight: d.count > 0 ? "2px" : "0",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────── */
/*  Status badge colours                    */
/* ──────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  RECEIVED: "#3b82f6",
  ROUTED: "#8b5cf6",
  ACCEPTED: "#10b981",
  COMPLETED: "#059669",
  REJECTED: "#ef4444",
  CANCELLED: "#6b7280",
  PROCESSING: "#3b82f6",
  ARCHIVED: "#9ca3af",
  UNKNOWN: "#d1d5db",
};

function statusColor(status: string) {
  return STATUS_COLORS[status] ?? "#94a3b8";
}

/* ──────────────────────────────────────── */
/*  Main Client Component                   */
/* ──────────────────────────────────────── */
export function ClinicReportsClient({
  clinicUid,
  initialData,
  initialPeriod = "month",
}: ClinicReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<ReportData>(initialData);
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod as ReportPeriod);
  const [customFrom, setCustomFrom] = useState(() => toInputDate(new Date()));
  const [customTo, setCustomTo] = useState(() => toInputDate(new Date()));
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printSections, setPrintSections] = useState<PrintSections>({ ...ALL_PRINT_SECTIONS });

  const refresh = useCallback(
    (nextPeriod: ReportPeriod, fromDate?: Date, toDate?: Date) => {
      const { from, to } =
        nextPeriod === "custom" && fromDate && toDate
          ? { from: fromDate, to: toDate }
          : getDateRangeForPeriod(nextPeriod);

      // Update URL for bookmarking
      const params = new URLSearchParams({ period: nextPeriod });
      if (nextPeriod === "custom") {
        params.set("from", toInputDate(from));
        params.set("to", toInputDate(to));
      }
      router.replace(`/v2/clinic/${clinicUid}/reports?${params.toString()}`, {
        scroll: false,
      });

      startTransition(async () => {
        const result = await getClinicReportsAction({
          clinicUid,
          from,
          to,
        });
        if (result.status && result.data) {
          setData(result.data);
        } else {
          toast.error(result.message ?? "Failed to load reports");
        }
      });
    },
    [clinicUid, router]
  );

  const handlePeriodChange = (value: string) => {
    const next = value as ReportPeriod;
    setPeriod(next);
    if (next !== "custom") {
      refresh(next);
    }
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) {
      toast.error("Please select both start and end dates");
      return;
    }
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (from > to) {
      toast.error("Start date must be before end date");
      return;
    }
    refresh("custom", from, to);
  };

  const { appointments, consultations, patients, diagnostics, staff, services } = data;

  const periodLabel = REPORT_PERIOD_LABELS[period] ?? "This Month";
  const fromLabel = formatDate(data.period.from);
  const toLabel = formatDate(data.period.to);

  const handlePrint = () => {
    setPrintSections({ ...ALL_PRINT_SECTIONS });
    setPrintDialogOpen(true);
  };

  const handleConfirmPrint = () => {
    const anySelected = Object.values(printSections).some(Boolean);
    if (!anySelected) {
      toast.error("Please select at least one section to include in the report.");
      return;
    }
    setPrintDialogOpen(false);
    const html = buildReportHtml(data, periodLabel, printSections);
    handlePrintHtmlToPDF(html);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Clinic Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {fromLabel} — {toLabel}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(REPORT_PERIOD_LABELS) as ReportPeriod[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {REPORT_PERIOD_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Label htmlFor="from" className="text-xs whitespace-nowrap">
                  From
                </Label>
                <Input
                  id="from"
                  type="date"
                  className="h-9 w-36 text-sm"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <Label htmlFor="to" className="text-xs whitespace-nowrap">
                  To
                </Label>
                <Input
                  id="to"
                  type="date"
                  className="h-9 w-36 text-sm"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleCustomApply} disabled={isPending}>
                Apply
              </Button>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}
          {!isPending && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => refresh(period)}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePrint}
            disabled={isPending}
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList className="overflow-x-auto [&::-webkit-scrollbar]:hidden w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="patients">Patient Insights</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="staff">Staff Activity</TabsTrigger>
          <TabsTrigger value="services">Service Utilization</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={Calendar}
              label="Appointments"
              value={appointments.total}
              sub={`${appointments.scheduled} scheduled · ${appointments.walkIn} walk-in`}
            />
            <KPICard
              icon={Stethoscope}
              label="Consultations"
              value={consultations.total}
            />
            <KPICard
              icon={Users}
              label="New Patients"
              value={patients.newInPeriod}
              sub={`${patients.totalActive} total active`}
            />
            <KPICard
              icon={ClipboardList}
              label="Diagnostics Issued"
              value={diagnostics.total}
              sub={`${periodLabel}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Appointment status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Appointments by Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No appointments in this period</p>
                ) : (
                  appointments.byStatus.map(({ status, count }) => (
                    <BreakdownRow
                      key={status}
                      label={status}
                      count={count}
                      total={appointments.total}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Consultation status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Consultations by Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {consultations.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No consultations in this period</p>
                ) : (
                  consultations.byStatus.map(({ status, count }) => (
                    <BreakdownRow
                      key={status}
                      label={status}
                      count={count}
                      total={consultations.total}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Diagnostics summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Diagnostics &amp; Documents — {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <DiagnosticStat
                  icon={FileText}
                  label="Prescriptions"
                  value={diagnostics.prescriptions}
                  color="#8b5cf6"
                />
                <DiagnosticStat
                  icon={FlaskConical}
                  label="Lab Requests"
                  value={diagnostics.labRequests}
                  color="#3b82f6"
                />
                <DiagnosticStat
                  icon={Microscope}
                  label="Imaging"
                  value={diagnostics.imagingRequests}
                  color="#06b6d4"
                />
                <DiagnosticStat
                  icon={Heart}
                  label="Heart Station"
                  value={diagnostics.heartRequests}
                  color="#ef4444"
                />
                <DiagnosticStat
                  icon={ClipboardList}
                  label="Med Certs"
                  value={diagnostics.medicalCertificates}
                  color="#10b981"
                />
                <DiagnosticStat
                  icon={Share2}
                  label="Referrals"
                  value={diagnostics.referralSlips}
                  color="#f59e0b"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appointments Tab ── */}
        <TabsContent value="appointments" className="space-y-5 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard
              icon={Calendar}
              label="Total Appointments"
              value={appointments.total}
            />
            <KPICard
              icon={TrendingUp}
              label="Scheduled"
              value={appointments.scheduled}
              sub="Online/in-advance bookings"
            />
            <KPICard
              icon={Users}
              label="Walk-in"
              value={appointments.walkIn}
              sub="Same-day walk-in"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  appointments.byStatus.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusColor(status) }}
                        />
                        <span className="text-sm capitalize">{status.toLowerCase()}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* By mode */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.byMode.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  appointments.byMode.map(({ mode, count }) => (
                    <BreakdownRow
                      key={mode}
                      label={mode}
                      count={count}
                      total={appointments.total}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* By type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.byType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  appointments.byType.map(({ type, count }) => (
                    <BreakdownRow
                      key={type}
                      label={type}
                      count={count}
                      total={appointments.total}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* By service (top 10) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Services Availed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.byService.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  appointments.byService.map(({ service, count, category }) => (
                    <div key={service} className="flex items-start justify-between py-1 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{service}</p>
                        <p className="text-xs text-muted-foreground">{category}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">
                        {count}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart data={appointments.dailyTrend} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                {appointments.dailyTrend.length > 0 && (
                  <>
                    <span>{appointments.dailyTrend[0]?.date}</span>
                    <span>{appointments.dailyTrend[appointments.dailyTrend.length - 1]?.date}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Consultations Tab ── */}
        <TabsContent value="consultations" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              icon={Stethoscope}
              label="Total Consultations"
              value={consultations.total}
              sub={`During ${periodLabel}`}
            />
            <KPICard
              icon={Activity}
              label="Completed"
              value={
                consultations.byStatus.find((s) => s.status === "COMPLETED")
                  ?.count ?? 0
              }
              sub="Successfully completed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {consultations.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  consultations.byStatus.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusColor(status) }}
                        />
                        <span className="text-sm capitalize">{status.toLowerCase()}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* By HP */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Healthcare Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {consultations.byHP.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  consultations.byHP.map(({ hp, count }) => (
                    <BreakdownRow
                      key={hp}
                      label={hp}
                      count={count}
                      total={consultations.total}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart
                data={consultations.dailyTrend}
                color="hsl(var(--secondary) / 0.7)"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                {consultations.dailyTrend.length > 0 && (
                  <>
                    <span>{consultations.dailyTrend[0]?.date}</span>
                    <span>
                      {consultations.dailyTrend[consultations.dailyTrend.length - 1]?.date}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Patient Insights Tab ── */}
        <TabsContent value="patients" className="space-y-5 mt-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard
              icon={Users}
              label="New Registrations"
              value={patients.newInPeriod}
              sub={`During ${periodLabel}`}
            />
            <KPICard
              icon={UserCheck}
              label="Total Active Patients"
              value={patients.totalActive}
              sub="All time"
            />
            <KPICard
              icon={PersonStanding}
              label="Profile Completion"
              value={`${patients.byProfileCompletion.find((x) => x.status === "COMPLETE")?.count ?? 0} / ${patients.totalActive}`}
              sub="Profiles marked complete"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gender */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Gender Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.byGender.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  patients.byGender.map(({ gender, count }) => (
                    <BreakdownRow
                      key={gender}
                      label={gender}
                      count={count}
                      total={patients.totalActive}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Age Groups */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Age Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.byAgeGroup.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  patients.byAgeGroup.map(({ group, count }) => (
                    <BreakdownRow
                      key={group}
                      label={group === "Unknown" ? "Age unknown" : `${group} yrs`}
                      count={count}
                      total={patients.totalActive}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Civil Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Civil Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.byCivilStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  patients.byCivilStatus.map(({ status, count }) => (
                    <BreakdownRow
                      key={status}
                      label={status}
                      count={count}
                      total={patients.totalActive}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Blood Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-500" />
                  Blood Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.byBloodType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  patients.byBloodType.map(({ type, count }) => (
                    <BreakdownRow
                      key={type}
                      label={type.replace("_", " ")}
                      count={count}
                      total={patients.totalActive}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Health Conditions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Top Health Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.topConditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recorded conditions</p>
                ) : (
                  patients.topConditions.map(({ condition, count }) => (
                    <BreakdownRow
                      key={condition}
                      label={condition}
                      count={count}
                      total={patients.topConditions.reduce((s, x) => s + x.count, 0)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Allergies */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Pill className="h-4 w-4 text-rose-500" />
                  Top Allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.topAllergies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recorded allergies</p>
                ) : (
                  patients.topAllergies.map(({ allergen, count }) => (
                    <BreakdownRow
                      key={allergen}
                      label={allergen}
                      count={count}
                      total={patients.topAllergies.reduce((s, x) => s + x.count, 0)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile completion & account type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Profile Completion Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.byProfileCompletion.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  patients.byProfileCompletion.map(({ status, count }) => (
                    <BreakdownRow
                      key={status}
                      label={status}
                      count={count}
                      total={patients.totalActive}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Account Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patients.byAccountType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  patients.byAccountType.map(({ type, count }) => (
                    <BreakdownRow
                      key={type}
                      label={type}
                      count={count}
                      total={patients.totalActive}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registration trend (last 12 months) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Patient Registration Trend (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrendChart
                data={patients.registrationTrend.map((r) => ({
                  date: r.month,
                  count: r.count,
                }))}
                color="hsl(var(--primary) / 0.65)"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                {patients.registrationTrend.length > 0 && (
                  <>
                    <span>{patients.registrationTrend[0]?.month}</span>
                    <span>
                      {patients.registrationTrend[patients.registrationTrend.length - 1]?.month}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Diagnostics Tab ── */}
        <TabsContent value="diagnostics" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <KPICard
              icon={ClipboardList}
              label="Total Documents Issued"
              value={diagnostics.total}
              sub={`During ${periodLabel}`}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard
              icon={FileText}
              label="Prescriptions"
              value={diagnostics.prescriptions}
              color="#8b5cf6"
            />
            <KPICard
              icon={FlaskConical}
              label="Lab Requests"
              value={diagnostics.labRequests}
              color="#3b82f6"
            />
            <KPICard
              icon={Microscope}
              label="Imaging Requests"
              value={diagnostics.imagingRequests}
              color="#06b6d4"
            />
            <KPICard
              icon={Heart}
              label="Heart Station"
              value={diagnostics.heartRequests}
              color="#ef4444"
            />
            <KPICard
              icon={ClipboardList}
              label="Medical Certificates"
              value={diagnostics.medicalCertificates}
              color="#10b981"
            />
            <KPICard
              icon={Share2}
              label="Referral Slips"
              value={diagnostics.referralSlips}
              color="#f59e0b"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Prescriptions", value: diagnostics.prescriptions, color: "#8b5cf6" },
                { label: "Lab Requests", value: diagnostics.labRequests, color: "#3b82f6" },
                { label: "Imaging Requests", value: diagnostics.imagingRequests, color: "#06b6d4" },
                { label: "Heart Station", value: diagnostics.heartRequests, color: "#ef4444" },
                { label: "Medical Certificates", value: diagnostics.medicalCertificates, color: "#10b981" },
                { label: "Referral Slips", value: diagnostics.referralSlips, color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm">{label}</span>
                      <span className="text-sm font-semibold tabular-nums">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: diagnostics.total > 0
                            ? `${(value / diagnostics.total) * 100}%`
                            : "0%",
                          backgroundColor: color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs w-10 justify-center">
                    {diagnostics.total > 0
                      ? `${Math.round((value / diagnostics.total) * 100)}%`
                      : "0%"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Staff Activity Tab ── */}
        <TabsContent value="staff" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              icon={Users}
              label="Total Staff Members"
              value={staff.totalMembers}
              sub="Active clinic members"
            />
            <KPICard
              icon={Stethoscope}
              label="Active Healthcare Providers"
              value={staff.hpActivity.length}
              sub={`With activity in ${periodLabel}`}
            />
          </div>

          {/* Members by role */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Members by Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {staff.byRole.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members</p>
              ) : (
                staff.byRole.map(({ role, count }) => (
                  <BreakdownRow
                    key={role}
                    label={role}
                    count={count}
                    total={staff.totalMembers}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* HP Activity table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Healthcare Provider Activity — {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staff.hpActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No HP activity in this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">Provider</th>
                        <th className="text-right py-2 px-2 font-medium">Consults</th>
                        <th className="text-right py-2 px-2 font-medium">Rx</th>
                        <th className="text-right py-2 px-2 font-medium">Lab</th>
                        <th className="text-right py-2 px-2 font-medium">Imaging</th>
                        <th className="text-right py-2 pl-2 font-medium">Med Certs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.hpActivity.map((hp) => (
                        <tr key={hp.name} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="py-2 pr-3 font-medium truncate max-w-[160px]">{hp.name}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{hp.consultations}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{hp.prescriptions}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{hp.labRequests}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{hp.imagingRequests}</td>
                          <td className="py-2 pl-2 text-right tabular-nums">{hp.medicalCertificates}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Service Utilization Tab ── */}
        <TabsContent value="services" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              icon={Wrench}
              label="Total Procedures Used"
              value={services.totalProcedures}
              sub={`During ${periodLabel}`}
            />
            <KPICard
              icon={Activity}
              label="Procedure Types"
              value={services.byType.length}
              sub="Distinct categories"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  By Procedure Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {services.byType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No procedure data in this period</p>
                ) : (
                  services.byType.map(({ type, count }) => (
                    <BreakdownRow
                      key={type}
                      label={type}
                      count={count}
                      total={services.totalProcedures}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top procedures */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Top Procedures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {services.topProcedures.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No procedure data in this period</p>
                ) : (
                  services.topProcedures.map(({ name, count, type }) => (
                    <div key={name} className="flex items-start justify-between py-1 border-b last:border-0 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">{type}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Print Section Selector Dialog ── */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </DialogTitle>
            <DialogDescription>
              Choose which sections to include in the exported report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {(Object.keys(printSections) as (keyof PrintSections)[]).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`section-${key}`}
                  checked={printSections[key]}
                  onCheckedChange={(checked) =>
                    setPrintSections((prev) => ({ ...prev, [key]: checked === true }))
                  }
                />
                <label
                  htmlFor={`section-${key}`}
                  className="text-sm font-medium leading-none cursor-pointer select-none"
                >
                  {PRINT_SECTION_LABELS[key]}
                </label>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-1 border-t">
              <button
                type="button"
                className="text-xs text-primary underline-offset-2 hover:underline"
                onClick={() => setPrintSections({ ...ALL_PRINT_SECTIONS })}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() =>
                  setPrintSections({
                    overview: false,
                    appointments: false,
                    consultations: false,
                    patientInsights: false,
                    diagnostics: false,
                    staffActivity: false,
                    serviceUtilization: false,
                  })
                }
              >
                Deselect all
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleConfirmPrint}>
              <Printer className="h-4 w-4" />
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────────────────────────────────── */
/*  Small diagnostic stat cell              */
/* ──────────────────────────────────────── */
function DiagnosticStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
