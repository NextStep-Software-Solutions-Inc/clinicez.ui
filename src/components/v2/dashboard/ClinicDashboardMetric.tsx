import React from "react";
import { cn } from "@lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClinicDashboardMetricProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * ClinicDashboardMetric
 * Displays a single metric in the clinic dashboard overview section.
 * Useful for KPIs and key performance indicators.
 */
export default function ClinicDashboardMetric({
  label,
  value,
  icon,
  className,
}: ClinicDashboardMetricProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-md bg-muted p-3 transition-colors hover:bg-muted/80", className)}>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-[var(--dash-accent)]">{value}</p>
      </div>
      {icon && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--dash-accent)]">{icon}</div>}
    </div>
  );
}
