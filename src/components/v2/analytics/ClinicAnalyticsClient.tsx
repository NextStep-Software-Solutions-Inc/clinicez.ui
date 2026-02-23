"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  Stethoscope,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  FlaskConical,
  Microscope,
  Heart,
  Share2,
  FileText,
  Award,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GetClinicAnalytics } from "@/actions/clinics/clinic-analytics.action";
import { formatDistanceToNow, format } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AnalyticsData = NonNullable<GetClinicAnalytics["data"]>;

interface ClinicAnalyticsClientProps {
  data: AnalyticsData;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  PENDING: "hsl(var(--chart-4))",
  RECEIVED: "hsl(var(--chart-3))",
  ROUTED: "hsl(var(--chart-2))",
  ACCEPTED: "hsl(var(--chart-1))",
  COMPLETED: "hsl(var(--chart-5))",
  CANCELLED: "hsl(var(--destructive))",
  REJECTED: "hsl(var(--destructive))",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "hsl(var(--muted-foreground))";
}

/* ------------------------------------------------------------------ */
/*  Small reusable sub-components                                      */
/* ------------------------------------------------------------------ */

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: number; // percentage change, undefined = no trend
  accent: string; // css variable like "--primary"
  subtitle?: string;
}

function StatTile({ label, value, icon: Icon, trend, accent, subtitle }: StatTileProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive
    ? "text-emerald-500"
    : isNegative
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <Card className="overflow-hidden border transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
              {value.toLocaleString()}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {isPositive ? "+" : ""}
                  {trend}% vs last month
                </span>
              </div>
            )}
          </div>
          <div
            className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: `hsl(var(${accent}) / 0.15)` }}
          >
            <Icon className="h-5 w-5" style={{ color: `hsl(var(${accent}))` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DistributionBarProps {
  label: string;
  count: number;
  total: number;
  color?: string;
}

function DistributionBar({ label, count, total, color }: DistributionBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[60%]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{count.toLocaleString()}</span>
          <Badge variant="secondary" className="text-[0.625rem] px-1.5 py-0">
            {pct}%
          </Badge>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: color ?? "hsl(var(--primary))",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ClinicAnalyticsClient({ data }: ClinicAnalyticsClientProps) {
  const { overview, monthlyTrends, appointmentBreakdown, diagnostics, recentPatients } = data;

  const totalDiagnostics =
    diagnostics.labRequests +
    diagnostics.imagingRequests +
    diagnostics.heartRequests +
    diagnostics.referralSlips +
    diagnostics.prescriptions +
    diagnostics.medicalCertificates;

  const totalAppointmentsByStatus = appointmentBreakdown.byStatus.reduce(
    (sum, s) => sum + s.count,
    0,
  );

  const topModeTotal = appointmentBreakdown.byMode.reduce((sum, m) => sum + m.count, 0);
  const topTypeTotal = appointmentBreakdown.byType.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6 pb-10 px-4 md:px-6">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Clinic Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Comprehensive overview of{" "}
          <span className="font-medium text-foreground">{data.clinic.name}</span> — all-time
          statistics and trends.
        </p>
      </div>

      {/* ── KPI Overview ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total Patients"
          value={overview.totalPatients}
          icon={Users}
          trend={overview.patientsTrend}
          accent="--primary"
          subtitle={`${overview.thisMonthPatients} new this month`}
        />
        <StatTile
          label="Total Appointments"
          value={overview.totalAppointments}
          icon={Calendar}
          trend={overview.appointmentsTrend}
          accent="--chart-2"
          subtitle={`${overview.thisMonthAppointments} this month`}
        />
        <StatTile
          label="Total Consultations"
          value={overview.totalConsultations}
          icon={Stethoscope}
          trend={overview.consultationsTrend}
          accent="--chart-3"
          subtitle={`${overview.thisMonthConsultations} this month`}
        />
        <StatTile
          label="Completion Rate"
          value={overview.completionRate}
          icon={CheckCircle2}
          accent="--chart-5"
          subtitle={`${overview.activeMembers} active team members`}
        />
      </div>

      {/* ── Monthly Trends chart ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Monthly Trends</CardTitle>
          </div>
          <CardDescription>Patients, appointments, and consultations over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="patients"
                  name="Patients"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="consultations"
                  name="Consultations"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-4 justify-center">
            {[
              { label: "Patients", color: "hsl(var(--primary))" },
              { label: "Appointments", color: "hsl(var(--chart-2))" },
              { label: "Consultations", color: "hsl(var(--chart-3))" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: item.color }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Middle row: Appointment Breakdown + Diagnostic Requests ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Appointment Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Appointment Status</CardTitle>
            </div>
            <CardDescription>Distribution by processing status</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentBreakdown.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No appointment data</p>
            ) : (
              <>
                <div className="h-52 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={appointmentBreakdown.byStatus}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                      <XAxis
                        dataKey="status"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                        {appointmentBreakdown.byStatus.map((entry) => (
                          <Cell key={entry.status} fill={getStatusColor(entry.status)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {appointmentBreakdown.byStatus.map((s) => (
                    <DistributionBar
                      key={s.status}
                      label={s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                      count={s.count}
                      total={totalAppointmentsByStatus}
                      color={getStatusColor(s.status)}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Requests */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Clinical Records</CardTitle>
            </div>
            <CardDescription>All-time diagnostic and clinical document counts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DistributionBar
              label="Lab Requests"
              count={diagnostics.labRequests}
              total={totalDiagnostics}
              color="hsl(var(--chart-1))"
            />
            <DistributionBar
              label="Imaging Requests"
              count={diagnostics.imagingRequests}
              total={totalDiagnostics}
              color="hsl(var(--chart-2))"
            />
            <DistributionBar
              label="Heart Station"
              count={diagnostics.heartRequests}
              total={totalDiagnostics}
              color="hsl(var(--chart-3))"
            />
            <DistributionBar
              label="Referral Slips"
              count={diagnostics.referralSlips}
              total={totalDiagnostics}
              color="hsl(var(--chart-4))"
            />
            <DistributionBar
              label="Prescriptions"
              count={diagnostics.prescriptions}
              total={totalDiagnostics}
              color="hsl(var(--chart-5))"
            />
            <DistributionBar
              label="Medical Certificates"
              count={diagnostics.medicalCertificates}
              total={totalDiagnostics}
              color="hsl(var(--primary))"
            />

            {/* Summary icons row */}
            <div className="mt-4 grid grid-cols-3 gap-3 pt-2 border-t">
              {[
                { icon: FlaskConical, label: "Lab", value: diagnostics.labRequests, color: "--chart-1" },
                { icon: Microscope, label: "Imaging", value: diagnostics.imagingRequests, color: "--chart-2" },
                { icon: Heart, label: "Heart", value: diagnostics.heartRequests, color: "--chart-3" },
                { icon: Share2, label: "Referrals", value: diagnostics.referralSlips, color: "--chart-4" },
                { icon: FileText, label: "Prescriptions", value: diagnostics.prescriptions, color: "--chart-5" },
                { icon: Award, label: "Med Certs", value: diagnostics.medicalCertificates, color: "--primary" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: `hsl(var(${color}) / 0.15)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: `hsl(var(${color}))` }} />
                  </div>
                  <p className="text-base font-bold tabular-nums">{value.toLocaleString()}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row: Mode/Type Distribution + Recent Patients ─────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Appointment mode distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appointment Modes</CardTitle>
            <CardDescription>Top modes by usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentBreakdown.byMode.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              appointmentBreakdown.byMode.map((m, i) => (
                <DistributionBar
                  key={m.name}
                  label={m.name}
                  count={m.count}
                  total={topModeTotal}
                  color={`hsl(var(--chart-${(i % 5) + 1}))`}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Appointment type distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appointment Types</CardTitle>
            <CardDescription>Top types by usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentBreakdown.byType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              appointmentBreakdown.byType.map((t, i) => (
                <DistributionBar
                  key={t.name}
                  label={t.name}
                  count={t.count}
                  total={topTypeTotal}
                  color={`hsl(var(--chart-${(i % 5) + 1}))`}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent patients */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Recent Patients</CardTitle>
            </div>
            <CardDescription>Newest additions to the clinic</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No patients yet</p>
            ) : (
              <ul className="space-y-3">
                {recentPatients.map((patient) => (
                  <li key={patient.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      {patient.picture && <AvatarImage src={patient.picture} alt={patient.name} />}
                      <AvatarFallback className="text-xs">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.gender ? `${patient.gender} · ` : ""}
                        {formatDistanceToNow(new Date(patient.joinedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[0.625rem] shrink-0">
                      {format(new Date(patient.joinedAt), "MMM d")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
