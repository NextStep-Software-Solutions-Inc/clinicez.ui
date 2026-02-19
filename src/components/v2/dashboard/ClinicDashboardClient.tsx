"use client";

import React from "react";
import {
  WelcomeHeader,
  ActivityLog,
  ProgressBar,
} from "@/components/v2/dashboard";
import { KPICard } from "@/components/v2/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Users,
  CalendarClock,
  Stethoscope,
  Banknote,
  Activity,
  Clock,
  FlaskConical,
  Microscope,
  Heart,
  Share2,
  TrendingUp,
  Calendar,
  UserCheck,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { ClinicDashboardData } from "@/types/clinic-dashboard.types";
import { formatDistanceToNow, format } from "date-fns";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: React.ReactNode;
}

interface ClinicDashboardClientProps {
  clinicUid: string;
  data: ClinicDashboardData;
  userName: string;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                     */
/* ─────────────────────────────────────────────────────────────────── */

/** Reusable glass card with consistent header treatment */
function GlassCard({
  icon: Icon,
  title,
  subtitle,
  accentVar,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  accentVar: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className="glassmorphic-card overflow-hidden border"
      style={{ borderColor: "hsl(var(--color-border-light))" }}
    >
      <CardHeader
        className="px-5 py-4 border-b"
        style={{
          borderColor: "hsl(var(--color-border-light))",
          background: `hsl(var(${accentVar}) / 0.06)`,
        }}
      >
        <CardTitle className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `hsl(var(${accentVar}) / 0.15)` }}
          >
            <Icon className="h-4 w-4" style={{ color: `hsl(var(${accentVar}))` }} />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: `hsl(var(${accentVar}))` }}
            >
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function ClinicDashboardClient({
  clinicUid: _clinicUid,
  data,
  userName,
}: ClinicDashboardClientProps) {
  const { metrics, diagnosticRequests, workload, schedule, teamStatus } = data;

  /* Build activity feed from server data */
  const activityItems: ActivityItem[] = [
    ...data.recentActivity.appointments.map((apt) => ({
      id: apt.id?.toString() ?? Math.random().toString(),
      action: apt.action,
      detail: apt.detail2 ? `${apt.detail} — ${apt.detail2}` : apt.detail,
      time: apt.time
        ? formatDistanceToNow(new Date(apt.time), { addSuffix: true })
        : "just now",
      icon: <Calendar className="h-4 w-4" />,
    })),
    ...data.recentActivity.newPatients.map(
      (p: (typeof data.recentActivity.newPatients)[0], idx: number) => ({
        id: `patient-${idx}`,
        action: p.action,
        detail: p.detail,
        time: "recently",
        icon: <Users className="h-4 w-4" />,
      })
    ),
  ].slice(0, 8);

  const totalDiagnostics =
    diagnosticRequests.labRequests +
    diagnosticRequests.imagingRequests +
    diagnosticRequests.heartRequests +
    diagnosticRequests.referrals;

  return (
    <div className="space-y-6 pb-10">

      {/* ── 1. Welcome banner ──────────────────────────────────────── */}
      <WelcomeHeader
        name={userName}
        subtitle={`${data.clinic.name} — Today's overview`}
        dashboardType="clinic"
      />

      {/* ── 2. KPI row ─────────────────────────────────────────────── */}
      <section aria-label="Key performance indicators">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Patients Today"
            value={metrics.patientsToday}
            icon={Users}
            trend={{ direction: "up", text: "registered today" }}
            progress={Math.min(metrics.patientsToday * 5, 100)}
            color="primary"
          />
          <KPICard
            label="Pending"
            value={metrics.pendingAppointments}
            icon={CalendarClock}
            trend={{ direction: "down", text: "awaiting action" }}
            progress={Math.min(metrics.pendingAppointments * 10, 100)}
            color="secondary"
          />
          <KPICard
            label="Active Consults"
            value={workload.activeConsultations}
            icon={Stethoscope}
            trend={{ direction: "up", text: "in progress now" }}
            progress={Math.min(workload.activeConsultations * 12, 100)}
            color="accent"
          />
          <KPICard
            label="Est. Revenue"
            value={`₱${(metrics.monthlyRevenue / 1000).toFixed(1)}k`}
            icon={Banknote}
            trend={{ direction: "up", text: "this month" }}
            progress={71}
            color="primary"
          />
        </div>
      </section>

      {/* ── 3. Today's schedule (primary focus, full-width) ────────── */}
      <section aria-label="Today's schedule">
        <GlassCard
          icon={Calendar}
          title="Today's Schedule"
          subtitle={
            schedule.upcomingAppointments.length > 0
              ? `${schedule.upcomingCount} appointment${schedule.upcomingCount !== 1 ? "s" : ""} queued`
              : "No appointments scheduled"
          }
          accentVar="--primary"
        >
          {schedule.upcomingAppointments.length > 0 ? (
            <ol className="space-y-2" role="list">
              {schedule.upcomingAppointments.map((apt, idx) => (
                <li
                  key={apt.id}
                  className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm hover:bg-muted/20"
                  style={{ borderColor: "hsl(var(--color-border-light))" }}
                >
                  {/* Position badge */}
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      background: "hsl(var(--primary) / 0.12)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Time block */}
                  <div
                    className="flex-shrink-0 text-center w-16 px-2 py-1.5 rounded-lg"
                    style={{
                      background: "hsl(var(--primary) / 0.08)",
                    }}
                  >
                    <Clock
                      className="h-3.5 w-3.5 mx-auto mb-0.5"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                    <p
                      className="text-xs font-semibold leading-tight"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {apt.timeStart ?? "—"}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {apt.subject}
                    </p>
                    {apt.timeEnd && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ends {apt.timeEnd}
                      </p>
                    )}
                  </div>

                  {/* Date badge */}
                  <span
                    className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {apt.date ? format(new Date(apt.date), "MMM d") : "TBD"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-3 opacity-25" />
              <p className="text-sm font-medium">All clear — no appointments today</p>
              <p className="text-xs mt-1 opacity-70">Check back tomorrow</p>
            </div>
          )}
        </GlassCard>
      </section>

      {/* ── 4. Three-column analysis zone ─────────────────────────── */}
      <section aria-label="Clinical analysis" className="grid gap-5 lg:grid-cols-3">

        {/* Active workload */}
        <GlassCard
          icon={Stethoscope}
          title="Active Workload"
          subtitle={`${workload.activeConsultations} consultation${workload.activeConsultations !== 1 ? "s" : ""} in progress`}
          accentVar="--primary"
        >
          {workload.consultationDetails.length > 0 ? (
            <ul className="space-y-2" role="list">
              {workload.consultationDetails.slice(0, 5).map((c) => (
                <li
                  key={c.id}
                  className="p-3 rounded-lg border text-sm"
                  style={{
                    background: "hsl(var(--primary) / 0.05)",
                    borderColor: "hsl(var(--primary) / 0.15)",
                  }}
                >
                  <p className="font-medium text-foreground truncate">{c.subject}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "hsl(var(--primary) / 0.15)",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ClipboardList className="h-9 w-9 mb-2 opacity-25" />
              <p className="text-sm">No active consultations</p>
            </div>
          )}
        </GlassCard>

        {/* Diagnostic requests */}
        <GlassCard
          icon={AlertTriangle}
          title="Diagnostic Requests"
          subtitle={`${totalDiagnostics} pending total`}
          accentVar="--chart-2"
        >
          <div className="space-y-3">
            {(
              [
                {
                  icon: FlaskConical,
                  label: "Laboratory",
                  count: diagnosticRequests.labRequests,
                  colorVar: "--chart-2",
                },
                {
                  icon: Microscope,
                  label: "Imaging",
                  count: diagnosticRequests.imagingRequests,
                  colorVar: "--chart-1",
                },
                {
                  icon: Heart,
                  label: "Heart Station",
                  count: diagnosticRequests.heartRequests,
                  colorVar: "--destructive",
                },
                {
                  icon: Share2,
                  label: "Referrals",
                  count: diagnosticRequests.referrals,
                  colorVar: "--chart-3",
                },
              ] as const
            ).map(({ icon: ItemIcon, label, count, colorVar }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  background: `hsl(var(${colorVar}) / 0.06)`,
                  borderColor: `hsl(var(${colorVar}) / 0.18)`,
                }}
              >
                <ItemIcon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: `hsl(var(${colorVar}))` }}
                />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {label}
                </span>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: `hsl(var(${colorVar}))` }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Performance metrics */}
        <GlassCard
          icon={TrendingUp}
          title="Performance"
          subtitle="Clinic efficiency metrics"
          accentVar="--chart-7"
        >
          <div className="space-y-5">
            {(
              [
                {
                  label: "Appointment Completion",
                  value: 88,
                  color: "blue" as const,
                },
                {
                  label: "Consultation Rate",
                  value: 92,
                  color: "blue" as const,
                },
                {
                  label: "Patient Satisfaction",
                  value: 96,
                  color: "green" as const,
                },
              ] as const
            ).map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground/80">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {value}%
                  </span>
                </div>
                <ProgressBar
                  label=""
                  value={value}
                  max={100}
                  color={color}
                  showPercentage={false}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ── 5. Team & activity ─────────────────────────────────────── */}
      <section aria-label="Team and activity" className="grid gap-5 lg:grid-cols-2">

        {/* Team status */}
        <GlassCard
          icon={UserCheck}
          title="Team On Duty"
          subtitle={`${teamStatus.totalMembers} active member${teamStatus.totalMembers !== 1 ? "s" : ""}`}
          accentVar="--chart-3"
        >
          {teamStatus.members.length > 0 ? (
            <ul className="space-y-1" role="list">
              {teamStatus.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {member.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-2 ring-border"
                    />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(var(--chart-3)), hsl(var(--chart-2)))",
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.role}
                    </p>
                  </div>
                  {/* Online indicator */}
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0 animate-pulse"
                    style={{ background: "hsl(var(--chart-2))" }}
                    title="Online"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-25" />
              <p className="text-sm">No team members found</p>
            </div>
          )}
        </GlassCard>

        {/* Recent activity */}
        <GlassCard
          icon={Activity}
          title="Recent Activity"
          subtitle="Latest clinic events"
          accentVar="--primary"
        >
          {activityItems.length > 0 ? (
            <ActivityLog items={activityItems} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Activity className="h-10 w-10 mb-2 opacity-25" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </GlassCard>
      </section>

      {/* ── 6. Status footer ──────────────────────────────────────── */}
      <footer aria-label="Dashboard status">
        <div
          className="glassmorphic-card-sm rounded-xl border px-5 py-3.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "hsl(var(--color-border-light))",
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.04) 0%, hsl(var(--chart-2) / 0.04) 100%)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "hsl(var(--primary))" }}
          >
            Live Dashboard
          </p>
          <p className="text-xs text-muted-foreground">
            {schedule.upcomingCount} scheduled&ensp;·&ensp;
            {workload.activeConsultations} active&ensp;·&ensp;
            {totalDiagnostics} diagnostics pending&ensp;·&ensp;
            Last updated {format(new Date(), "HH:mm")}
          </p>
        </div>
      </footer>
    </div>
  );
}
