import React from "react";
import { cn } from "@lib/utils";
import type { DashboardType } from "./DashboardShell";
import { Calendar, Clock, Stethoscope, Building2, Activity } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface WelcomeHeaderProps {
  name: string;
  subtitle?: string;
  dashboardType?: DashboardType;
  /** Optional action buttons rendered on the right */
  actions?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function getCurrentTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WelcomeHeader({
  name,
  subtitle,
  dashboardType,
  actions,
  className,
}: WelcomeHeaderProps) {
  const greeting = getTimeOfDayGreeting();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-lg",
        // Glassmorphic base — teal-anchored, matches the dashboard palette
        "bg-gradient-to-br from-[hsl(175,83%,32%)]/90 via-[hsl(195,65%,38%)]/80 to-[hsl(175,83%,24%)]/90",
        "border border-[hsl(175,83%,50%)]/30",
        "backdrop-blur-md",
        "p-6 sm:p-8",
        className,
      )}
      data-dashboard={dashboardType}
    >
      {/* ── Decorative mesh grid overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(0,0%,100%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Decorative glow orbs ── */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[hsl(195,65%,60%)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[hsl(175,83%,60%)]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-0 h-24 w-24 rounded-full bg-[hsl(20,82%,70%)]/10 blur-2xl" />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        {/* Left: greeting + clinic info */}
        <div className="flex-1 min-w-0">

          {/* Clinic badge */}
          {subtitle && (
            <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
              <Building2 className="h-3 w-3 text-white/80 flex-shrink-0" />
              <span className="text-xs font-semibold text-white/90 truncate">{subtitle}</span>
            </div>
          )}

          {/* Greeting */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 leading-none mb-1">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Dr. {name}
              </h1>
            </div>
          </div>

          {/* Date / time strip */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>{getCurrentTime()}</span>
            </div>
          </div>
        </div>

        {/* Right: status indicator + optional actions */}
        <div className="flex flex-col gap-3 items-start sm:items-end">
          {/* System status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <Activity className="h-3.5 w-3.5 text-white/80" />
            <span className="text-xs font-semibold text-white/90">Clinic Online</span>
          </div>

          {/* Optional action buttons */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
