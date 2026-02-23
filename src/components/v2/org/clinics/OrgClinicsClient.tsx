"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Users,
  UserCheck,
  Activity,
  Calendar,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Globe,
  Mail,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WelcomeHeader } from "@/components/v2/dashboard";
import { KPICard } from "@/components/v2/dashboard/KPICard";
import Link from "next/link";
import { format } from "date-fns";
import type { OrgClinicsData, OrgClinicDetail } from "@/types/org-clinics.types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrgClinicsClientProps {
  orgUid: string;
  data: OrgClinicsData;
  orgName: string;
  userName: string;
  orgRole?: string;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={
        isActive
          ? {
              background: "hsl(var(--chart-2) / 0.15)",
              color: "hsl(var(--chart-2))",
            }
          : {
              background: "hsl(var(--muted) / 0.5)",
              color: "hsl(var(--muted-foreground))",
            }
      }
    >
      {isActive ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ClinicCard({ clinic }: { clinic: OrgClinicDetail }) {
  return (
    <Card
      className="glassmorphic-card overflow-hidden border group hover:shadow-md transition-all duration-200"
      style={{ borderColor: "hsl(var(--color-border-light))" }}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo / Avatar */}
          <Avatar className="h-12 w-12 rounded-xl flex-shrink-0">
            {clinic.logo && <AvatarImage src={clinic.logo} alt={clinic.name} />}
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
              {clinic.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {clinic.name}
                </p>
                {clinic.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {clinic.description}
                  </p>
                )}
              </div>
              <StatusBadge isActive={clinic.isActive} />
            </div>

            {/* Contact row */}
            {clinic.email && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{clinic.email}</span>
              </div>
            )}

            {/* Visibility */}
            {clinic.setting && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3 flex-shrink-0" />
                <span>{clinic.setting.isPublic ? "Public clinic" : "Private clinic"}</span>
              </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold text-foreground">
                    {clinic.activeMemberCount}
                  </span>
                  /{clinic.memberCount} members
                </span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold text-foreground">
                    {clinic.patientCount}
                  </span>{" "}
                  patients
                </span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold text-foreground">
                    {clinic.appointmentCount}
                  </span>{" "}
                  appts
                </span>
              </span>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t"
              style={{ borderColor: "hsl(var(--color-border-light))" }}>
              <span className="text-xs text-muted-foreground">
                Added {format(new Date(clinic.createdAt), "MMM d, yyyy")}
              </span>
              <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                <Link href={`/v2/clinic/${clinic.clinicUid}`}>
                  Open <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClinicListRow({ clinic }: { clinic: OrgClinicDetail }) {
  return (
    <div
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors"
    >
      <Avatar className="h-9 w-9 rounded-lg flex-shrink-0">
        {clinic.logo && <AvatarImage src={clinic.logo} alt={clinic.name} />}
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
          {clinic.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{clinic.name}</p>
        {clinic.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{clinic.description}</p>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {clinic.memberCount}
        </span>
        <span className="flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5" />
          {clinic.patientCount}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {clinic.appointmentCount}
        </span>
      </div>

      <StatusBadge isActive={clinic.isActive} />

      <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs flex-shrink-0">
        <Link href={`/v2/clinic/${clinic.clinicUid}`}>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function OrgClinicsClient({
  orgUid,
  data,
  orgName,
  userName,
  orgRole,
}: OrgClinicsClientProps) {
  const { clinics, metrics } = data;
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clinics, search]);

  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Welcome header ──────────────────────────────────────── */}
      <WelcomeHeader
        name={userName}
        subtitle={orgRole}
        dashboardType="organization"
      />

      {/* ── 2. KPI row ──────────────────────────────────────────────── */}
      <section aria-label="Clinics overview metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Total Clinics"
            value={metrics.totalClinics}
            icon={Building2}
            trend={{ direction: "up", text: "all time" }}
            progress={100}
            color="primary"
          />
          <KPICard
            label="Active Clinics"
            value={metrics.activeClinics}
            icon={CheckCircle2}
            trend={{
              direction: "up",
              text:
                metrics.totalClinics > 0
                  ? `${Math.round((metrics.activeClinics / metrics.totalClinics) * 100)}% active`
                  : "0% active",
            }}
            progress={
              metrics.totalClinics > 0
                ? Math.round(
                    (metrics.activeClinics / metrics.totalClinics) * 100
                  )
                : 0
            }
            color="secondary"
          />
          <KPICard
            label="Total Members"
            value={metrics.totalMembers}
            icon={Users}
            trend={{ direction: "up", text: "across all clinics" }}
            progress={100}
            color="accent"
          />
          <KPICard
            label="Total Patients"
            value={metrics.totalPatients}
            icon={UserCheck}
            trend={{ direction: "up", text: "registered" }}
            progress={100}
            color="primary"
          />
        </div>
      </section>

      {/* ── 3. Summary strip ──────────────────────────────────────── */}
      <section aria-label="Appointment summary">
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              {
                label: "Total Appointments",
                value: metrics.totalAppointments,
                icon: Calendar,
                accentVar: "--chart-3",
              },
              {
                label: "Inactive Clinics",
                value: metrics.inactiveClinics,
                icon: XCircle,
                accentVar: "--destructive",
              },
              {
                label: "Avg Members / Clinic",
                value:
                  metrics.totalClinics > 0
                    ? Math.round(metrics.totalMembers / metrics.totalClinics)
                    : 0,
                icon: Activity,
                accentVar: "--chart-4",
              },
            ] as const
          ).map(({ label, value, icon: Icon, accentVar }) => (
            <Card
              key={label}
              className="glassmorphic-card border"
              style={{ borderColor: "hsl(var(--color-border-light))" }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `hsl(var(${accentVar}) / 0.12)`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: `hsl(var(${accentVar}))` }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 4. Clinics list ───────────────────────────────────────── */}
      <GlassCard
        icon={Building2}
        title={`Clinics · ${orgName}`}
        subtitle={`${metrics.totalClinics} clinic${metrics.totalClinics !== 1 ? "s" : ""} linked to this organization`}
        accentVar="--primary"
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clinics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-lg p-1"
            style={{ borderColor: "hsl(var(--color-border-light))" }}>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter badges */}
        {search && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs gap-1">
              Search: &ldquo;{search}&rdquo;
              <button
                className="ml-1 hover:text-foreground"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            </Badge>
            <span className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Clinic grid / list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {search ? "No clinics match your search" : "No clinics linked yet"}
            </p>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((clinic) => (
              <ClinicCard key={clinic.clinicUid} clinic={clinic} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="hidden sm:flex items-center gap-4 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-9 flex-shrink-0" />
              <div className="flex-1">Clinic</div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="w-14 text-center">Members</span>
                <span className="w-14 text-center">Patients</span>
                <span className="w-14 text-center">Appts</span>
              </div>
              <span className="w-16 flex-shrink-0">Status</span>
              <span className="w-7 flex-shrink-0" />
            </div>
            {filtered.map((clinic) => (
              <ClinicListRow key={clinic.clinicUid} clinic={clinic} />
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── 5. Status footer ─────────────────────────────────────────── */}
      <footer aria-label="Clinics status">
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
            Live View
          </p>
          <p className="text-xs text-muted-foreground">
            {metrics.activeClinics} active&ensp;·&ensp;
            {metrics.inactiveClinics} inactive&ensp;·&ensp;
            {metrics.totalMembers} member{metrics.totalMembers !== 1 ? "s" : ""}&ensp;·&ensp;
            {metrics.totalPatients} patient{metrics.totalPatients !== 1 ? "s" : ""}&ensp;·&ensp;
            Last updated {format(new Date(), "HH:mm")}
          </p>
        </div>
      </footer>
    </div>
  );
}
