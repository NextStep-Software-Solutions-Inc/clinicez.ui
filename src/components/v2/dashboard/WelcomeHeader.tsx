import React from "react";
import { cn } from "@lib/utils";
import type { DashboardType } from "./DashboardShell";
import { Calendar, Clock, Sparkles } from "lucide-react";

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
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-0 shadow-lg",
        "bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-blue-500/15",
        "dark:from-indigo-500/25 dark:via-purple-500/20 dark:to-blue-500/25",
        "p-8 sm:p-10",
        className,
      )}
      data-dashboard={dashboardType}
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          {/* Greeting with icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-300 dark:via-purple-300 dark:to-blue-300 bg-clip-text text-transparent">
              Welcome back, {name}
            </h1>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg text-foreground/80 font-medium ml-13 sm:ml-13">
              {subtitle}
            </p>
          )}

          {/* Date and time info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getCurrentTime()}</span>
            </div>
          </div>
        </div>

        {/* Action buttons on the right */}
        {actions && (
          <div className="flex items-center gap-3 ml-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
