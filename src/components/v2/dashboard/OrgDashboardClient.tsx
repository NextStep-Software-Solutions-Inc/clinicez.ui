"use client";

import React from "react";
import { WelcomeHeader, ActivityLog, ProgressBar } from "@/components/v2/dashboard";
import { KPICard } from "@/components/v2/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Users,
  Building2,
  ShieldCheck,
  Clock,
  UserCheck,
  Activity,
  BookOpen,
  Briefcase,
  GraduationCap,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { OrgDashboardData } from "@/types/org-dashboard.types";
import { formatDistanceToNow, format } from "date-fns";
import type { ActivityItem } from "@/components/v2/dashboard";

/* ─────────────────────────────────────────────────────────────────── */
/*  Props                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface OrgDashboardClientProps {
  orgUid: string;
  data: OrgDashboardData;
  userName: string;
  orgRole?: string;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                     */
/* ─────────────────────────────────────────────────────────────────── */

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
            <Icon
              className="h-4 w-4"
              style={{ color: `hsl(var(${accentVar}))` }}
            />
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

/* status badge helper */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACTIVE: { bg: "hsl(var(--chart-2) / 0.15)", color: "hsl(var(--chart-2))", label: "Active" },
    PENDING: { bg: "hsl(var(--chart-4) / 0.15)", color: "hsl(var(--chart-4))", label: "Pending" },
    SUSPENDED: { bg: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))", label: "Suspended" },
    INACTIVE: { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: "Inactive" },
  };
  const cfg = map[status] ?? { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: status };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function OrgDashboardClient({
  orgUid: _orgUid,
  data,
  userName,
  orgRole,
}: OrgDashboardClientProps) {
  const { organization, metrics, recentMembers, clinics, roleBreakdown } = data;

  /* Build activity feed from recent members */
  const activityItems: ActivityItem[] = recentMembers.map((m) => ({
    id: m.id.toString(),
    action: `${m.name} joined`,
    detail: `Role: ${m.roleName} — Status: ${m.status}`,
    time: formatDistanceToNow(new Date(m.joinedAt), { addSuffix: true }),
    icon: <Users className="h-4 w-4" />,
  }));

  const totalRoleMembers = roleBreakdown.reduce((s, r) => s + r.memberCount, 0);

  return (
    <div className="space-y-6 pb-10">

      {/* ── 1. Welcome banner ──────────────────────────────────────── */}
      <WelcomeHeader
        name={userName}
        professionalTitle={orgRole}
        subtitle={`${organization.name} — Organization overview`}
        dashboardType="organization"
      />

      {/* ── 2. Member KPI row ──────────────────────────────────────── */}
      <section aria-label="Member key performance indicators">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Total Members"
            value={metrics.totalMembers}
            icon={Users}
            trend={{ direction: "up", text: "registered members" }}
            progress={Math.min(metrics.totalMembers, 100)}
            color="primary"
          />
          <KPICard
            label="Active Members"
            value={metrics.activeMembers}
            icon={UserCheck}
            trend={{ direction: "up", text: "active memberships" }}
            progress={
              metrics.totalMembers > 0
                ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
                : 0
            }
            color="accent"
          />
          <KPICard
            label="Pending"
            value={metrics.pendingMembers}
            icon={Clock}
            trend={{ direction: "down", text: "awaiting approval" }}
            progress={Math.min(metrics.pendingMembers * 10, 100)}
            color="secondary"
          />
          <KPICard
            label="Linked Clinics"
            value={metrics.totalClinics}
            icon={Building2}
            trend={{ direction: "up", text: "associated clinics" }}
            progress={Math.min(metrics.totalClinics * 20, 100)}
            color="primary"
          />
        </div>
      </section>

      {/* ── 3. Structure summary ────────────────────────────────────── */}
      <section aria-label="Organization structure">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              { icon: ShieldCheck, label: "Roles", count: metrics.totalRoles, colorVar: "--chart-3" },
              { icon: Layers, label: "Departments", count: metrics.totalDepartments, colorVar: "--chart-2" },
              { icon: GraduationCap, label: "Colleges", count: metrics.totalColleges, colorVar: "--chart-1" },
              { icon: BookOpen, label: "Programs", count: metrics.totalPrograms, colorVar: "--chart-4" },
              { icon: Briefcase, label: "Offices", count: metrics.totalOffices, colorVar: "--chart-7" },
            ]
          ).map(({ icon: ItemIcon, label, count, colorVar }) => (
            <Card
              key={label}
              className="glassmorphic-card border"
              style={{ borderColor: "hsl(var(--color-border-light))" }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `hsl(var(${colorVar}) / 0.15)` }}
                >
                  <ItemIcon
                    className="h-5 w-5"
                    style={{ color: `hsl(var(${colorVar}))` }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 4. Members & Role breakdown ─────────────────────────────── */}
      <section aria-label="Members and roles" className="grid gap-5 lg:grid-cols-2">

        {/* Recent Members */}
        <GlassCard
          icon={Users}
          title="Recent Members"
          subtitle={`Latest ${recentMembers.length} registrations`}
          accentVar="--primary"
        >
          {recentMembers.length > 0 ? (
            <ul className="space-y-1" role="list">
              {recentMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {member.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.picture}
                      alt={member.name}
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-2 ring-border"
                    />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
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
                      {member.roleName}
                    </p>
                  </div>
                  <StatusBadge status={member.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-25" />
              <p className="text-sm">No members yet</p>
            </div>
          )}
        </GlassCard>

        {/* Role Breakdown */}
        <GlassCard
          icon={ShieldCheck}
          title="Role Distribution"
          subtitle={`${metrics.totalRoles} active role${metrics.totalRoles !== 1 ? "s" : ""}`}
          accentVar="--chart-3"
        >
          {roleBreakdown.length > 0 ? (
            <div className="space-y-4">
              {roleBreakdown.map((role) => (
                <div key={role.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground/80 truncate">
                      {role.name}
                    </span>
                    <span className="text-sm font-bold text-foreground ml-2 flex-shrink-0">
                      {role.memberCount}
                    </span>
                  </div>
                  <ProgressBar
                    label=""
                    value={role.memberCount}
                    max={Math.max(totalRoleMembers, 1)}
                    color="blue"
                    showPercentage={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mb-2 opacity-25" />
              <p className="text-sm">No roles configured</p>
            </div>
          )}
        </GlassCard>
      </section>

      {/* ── 5. Clinics ─────────────────────────────────────────────── */}
      <section aria-label="Linked clinics">
        <GlassCard
          icon={Building2}
          title="Linked Clinics"
          subtitle={`${metrics.totalClinics} clinic${metrics.totalClinics !== 1 ? "s" : ""} associated`}
          accentVar="--chart-2"
        >
          {clinics.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clinics.map((clinic) => (
                <div
                  key={clinic.clinicUid}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors"
                  style={{
                    borderColor: "hsl(var(--color-border-light))",
                    background: "hsl(var(--chart-2) / 0.04)",
                  }}
                >
                  {clinic.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clinic.logo}
                      alt={clinic.name}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-border"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(var(--chart-2) / 0.15)" }}
                    >
                      <Building2
                        className="h-5 w-5"
                        style={{ color: "hsl(var(--chart-2))" }}
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {clinic.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Clinic</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-2 opacity-25" />
              <p className="text-sm">No clinics linked yet</p>
            </div>
          )}
        </GlassCard>
      </section>

      {/* ── 6. Performance overview + Activity ─────────────────────── */}
      <section aria-label="Performance and activity" className="grid gap-5 lg:grid-cols-2">

        {/* Membership health */}
        <GlassCard
          icon={TrendingUp}
          title="Membership Health"
          subtitle="Engagement and status overview"
          accentVar="--chart-7"
        >
          <div className="space-y-5">
            {(
              [
                {
                  label: "Active Rate",
                  value: metrics.totalMembers > 0
                    ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
                    : 0,
                  color: "green" as const,
                },
                {
                  label: "Pending Approvals",
                  value: metrics.totalMembers > 0
                    ? Math.round((metrics.pendingMembers / metrics.totalMembers) * 100)
                    : 0,
                  color: "blue" as const,
                },
                {
                  label: "Suspended",
                  value: metrics.totalMembers > 0
                    ? Math.round((metrics.suspendedMembers / metrics.totalMembers) * 100)
                    : 0,
                  color: "red" as const,
                },
              ] as const
            ).map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground/80">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}%</span>
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

        {/* Recent Activity */}
        <GlassCard
          icon={Activity}
          title="Recent Activity"
          subtitle="Latest member events"
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

      {/* ── 7. Membership breakdown quick stats ─────────────────────── */}
      {metrics.suspendedMembers > 0 && (
        <section aria-label="Alerts">
          <div
            className="rounded-xl border px-5 py-4 flex items-center gap-3"
            style={{
              borderColor: "hsl(var(--destructive) / 0.3)",
              background: "hsl(var(--destructive) / 0.05)",
            }}
          >
            <AlertTriangle
              className="h-5 w-5 flex-shrink-0"
              style={{ color: "hsl(var(--destructive))" }}
            />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{metrics.suspendedMembers}</span> suspended
              member{metrics.suspendedMembers !== 1 ? "s" : ""} — review and take action.
            </p>
          </div>
        </section>
      )}

      {/* ── 8. Status footer ──────────────────────────────────────── */}
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
            {metrics.activeMembers} active&ensp;·&ensp;
            {metrics.pendingMembers} pending&ensp;·&ensp;
            {metrics.totalClinics} clinic{metrics.totalClinics !== 1 ? "s" : ""}&ensp;·&ensp;
            {organization.isActive ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 inline" /> Active org
              </span>
            ) : (
              "Inactive org"
            )}
            &ensp;·&ensp;Last updated {format(new Date(), "HH:mm")}
          </p>
        </div>
      </footer>
    </div>
  );
}
