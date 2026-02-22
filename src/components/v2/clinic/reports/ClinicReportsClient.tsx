"use client";

import { useState, useTransition, useCallback } from "react";
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
import { toast } from "sonner";
import type { GetClinicReports } from "@/actions/clinics/clinic-reports.action";
import { getClinicReportsAction } from "@/actions/clinics/clinic-reports.action";
import {
  type ReportPeriod,
  REPORT_PERIOD_LABELS,
  getDateRangeForPeriod,
} from "@/lib/report-period-utils";

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

  const { appointments, consultations, patients, diagnostics } = data;

  const periodLabel = REPORT_PERIOD_LABELS[period] ?? "This Month";
  const fromLabel = formatDate(data.period.from);
  const toLabel = formatDate(data.period.to);

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
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList className="overflow-x-auto [&::-webkit-scrollbar]:hidden w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
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

        {/* ── Patients Tab ── */}
        <TabsContent value="patients" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              icon={Users}
              label="New Patients"
              value={patients.newInPeriod}
              sub={`Registered during ${periodLabel}`}
            />
            <KPICard
              icon={Users}
              label="Total Active Patients"
              value={patients.totalActive}
              sub="All time"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Patient Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 py-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {patients.newInPeriod}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    New registrations
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {periodLabel}
                  </p>
                </div>
                <div className="flex-1 h-px bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold">{patients.totalActive}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total patients
                  </p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
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
      </Tabs>
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
