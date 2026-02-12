import React from "react";
import { cn } from "@lib/utils";
import type { DashboardType } from "./DashboardShell";

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
        "v2-content__header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      data-dashboard={dashboardType}
    >
      <div>
        <h1 className="v2-content__title">Welcome back, {name}</h1>
        {subtitle && <p className="v2-content__subtitle">{subtitle}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{formatDate()}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
