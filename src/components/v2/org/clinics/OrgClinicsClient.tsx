"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  UserRound,
  CalendarClock,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Globe,
  Mail,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { GetOrgClinicsData } from "@/actions/organizations/org-clinics.action";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type OrgClinicItem = NonNullable<NonNullable<GetOrgClinicsData["data"]>["clinics"]>[number];

interface OrgClinicsClientProps {
  clinics: OrgClinicItem[];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Helper sub-components                                              */
/* ─────────────────────────────────────────────────────────────────── */

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge
      className="gap-1 text-xs font-semibold border-0"
      style={{
        background: "hsl(var(--chart-2) / 0.15)",
        color: "hsl(var(--chart-2))",
      }}
    >
      <CheckCircle2 className="h-3 w-3" />
      Active
    </Badge>
  ) : (
    <Badge
      className="gap-1 text-xs font-semibold border-0"
      style={{
        background: "hsl(var(--destructive) / 0.15)",
        color: "hsl(var(--destructive))",
      }}
    >
      <XCircle className="h-3 w-3" />
      Inactive
    </Badge>
  );
}

function ClinicCard({ clinic }: { clinic: OrgClinicItem }) {
  return (
    <Card
      className="border hover:shadow-md transition-shadow"
      style={{ borderColor: "hsl(var(--color-border-light))" }}
    >
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
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
              style={{ background: "hsl(var(--chart-2) / 0.15)" }}
            >
              <Building2
                className="h-6 w-6"
                style={{ color: "hsl(var(--chart-2))" }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {clinic.name}
              </h3>
              <StatusBadge isActive={clinic.isActive} />
            </div>
            {clinic.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {clinic.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="space-y-1.5">
          {clinic.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{clinic.email}</span>
            </div>
          )}
          {clinic.setting?.facilityName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{clinic.setting.facilityName}</span>
            </div>
          )}
          {clinic.setting?.isPublic !== undefined && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{clinic.setting.isPublic ? "Public clinic" : "Private clinic"}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t" style={{ borderColor: "hsl(var(--color-border-light))" }}>
          <div className="flex flex-col items-center gap-0.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{clinic.memberCount}</span>
            <span className="text-[10px] text-muted-foreground">Members</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{clinic.patientCount}</span>
            <span className="text-[10px] text-muted-foreground">Patients</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{clinic.appointmentCount}</span>
            <span className="text-[10px] text-muted-foreground">Appts</span>
          </div>
        </div>

        {/* Features row */}
        {clinic.setting && (
          <div className="flex flex-wrap gap-1.5">
            {clinic.setting.enableAppointment && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "hsl(var(--chart-1) / 0.12)",
                  color: "hsl(var(--chart-1))",
                }}
              >
                Appointments
              </span>
            )}
            {clinic.setting.enableConsultation && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "hsl(var(--chart-3) / 0.12)",
                  color: "hsl(var(--chart-3))",
                }}
              >
                Consultations
              </span>
            )}
            {clinic.setting.philhealthAccreditationNumber && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "hsl(var(--chart-4) / 0.12)",
                  color: "hsl(var(--chart-4))",
                }}
              >
                PhilHealth
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "hsl(var(--color-border-light))" }}>
          <p className="text-[10px] text-muted-foreground">
            Linked {format(new Date(clinic.linkedAt), "MMM d, yyyy")}
          </p>
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link href={`/v2/clinic/${clinic.clinicUid}`}>
              <ExternalLink className="h-3 w-3" />
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function OrgClinicsClient({ clinics }: OrgClinicsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return clinics.filter((c) => {
      const matchesSearch =
        search.trim() === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [clinics, search, statusFilter]);

  return (
    <div className="space-y-6 pb-10">
      {/* ── Filter bar ────────────────────────────────────────────── */}
      <section aria-label="Clinic filters">
        <Card style={{ borderColor: "hsl(var(--color-border-light))" }}>
          <CardHeader className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--color-border-light))" }}>
            <CardTitle className="flex items-center gap-2.5 text-sm font-semibold">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(var(--chart-2) / 0.15)" }}
              >
                <Activity className="h-4 w-4" style={{ color: "hsl(var(--chart-2))" }} />
              </div>
              Linked Clinics
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {filtered.length} of {clinics.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search clinics by name, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
              >
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Clinic grid ───────────────────────────────────────────── */}
      <section aria-label="Clinic list">
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((clinic) => (
              <ClinicCard key={clinic.clinicUid} clinic={clinic} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl border flex flex-col items-center justify-center py-16 text-muted-foreground"
            style={{ borderColor: "hsl(var(--color-border-light))" }}
          >
            <Building2 className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No clinics found</p>
            <p className="text-xs mt-1">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter."
                : "No clinics are linked to this organization yet."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
