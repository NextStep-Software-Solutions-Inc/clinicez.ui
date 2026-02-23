"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Users,
  UserCog,
  Calendar,
  ClipboardList,
  Globe,
  GlobeLock,
  CheckCircle2,
  XCircle,
  Stethoscope,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GetOrgClinics } from "@/actions/organizations/org-clinics.action";

type OrgClinicItem = NonNullable<GetOrgClinics["data"]>[number];

interface OrgClinicsClientProps {
  clinics: OrgClinicItem[];
}

/* ─── Stat pill ────────────────────────────────────────────────────── */
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

/* ─── Clinic card ──────────────────────────────────────────────────── */
function ClinicListCard({ clinic }: { clinic: OrgClinicItem }) {
  const isPublic = clinic.setting?.isPublic ?? false;

  return (
    <Card
      className="group hover:shadow-md transition-shadow overflow-hidden border"
      style={{ borderColor: "hsl(var(--color-border-light))" }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Logo / placeholder */}
          {clinic.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinic.logo}
              alt={clinic.name}
              className="h-12 w-12 rounded-xl object-cover flex-shrink-0 ring-1 ring-border"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--chart-2) / 0.12)" }}
            >
              <Building2
                className="h-6 w-6"
                style={{ color: "hsl(var(--chart-2))" }}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight truncate">
                {clinic.name}
              </CardTitle>
              {/* Status badge */}
              {clinic.isActive ? (
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs gap-1 border-destructive/30 text-destructive bg-destructive/5"
                >
                  <XCircle className="h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-1 mt-1">
              {isPublic ? (
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <GlobeLock className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>

        {clinic.description && (
          <CardDescription className="mt-2 line-clamp-2 text-sm">
            {clinic.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <StatPill icon={Users} label="members" value={clinic.memberCount} />
          <StatPill icon={UserCog} label="patients" value={clinic.patientCount} />
          <StatPill
            icon={Calendar}
            label="appt modes"
            value={clinic.appointmentModeCount}
          />
          <StatPill
            icon={ClipboardList}
            label="appt types"
            value={clinic.appointmentTypeCount}
          />
        </div>

        {/* Feature flags */}
        {clinic.setting && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {clinic.setting.enableAppointment && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Calendar className="h-3 w-3" />
                Appointments
              </Badge>
            )}
            {clinic.setting.enableConsultation && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Stethoscope className="h-3 w-3" />
                Consultations
              </Badge>
            )}
            {clinic.setting.facilityName && (
              <Badge variant="outline" className="text-xs">
                {clinic.setting.facilityName}
              </Badge>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1 gap-1.5">
            <Link href={`/v2/clinic/${clinic.clinicUid}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open Clinic
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main client component ────────────────────────────────────────── */
export function OrgClinicsClient({ clinics }: OrgClinicsClientProps) {
  const [search, setSearch] = useState("");

  const filtered = clinics.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.setting?.facilityName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = clinics.filter((c) => c.isActive).length;
  const publicCount = clinics.filter((c) => c.setting?.isPublic).length;

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clinics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clinics.length} clinic{clinics.length !== 1 ? "s" : ""} linked to this organization
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {activeCount} active
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            {publicCount} public
          </Badge>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search clinics…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Clinic grid ───────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((clinic) => (
            <ClinicListCard key={clinic.clinicUid} clinic={clinic} />
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-base font-medium">No clinics linked yet</p>
          <p className="text-sm mt-1">
            Link a clinic to this organization to see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-base font-medium">No clinics match your search</p>
          <p className="text-sm mt-1">Try a different keyword.</p>
        </div>
      )}
    </div>
  );
}
