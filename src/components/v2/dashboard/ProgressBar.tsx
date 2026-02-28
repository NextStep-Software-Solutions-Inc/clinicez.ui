import React from "react";
import { cn } from "@lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: "blue" | "green" | "amber" | "red";
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Color mapping                                                      */
/* ------------------------------------------------------------------ */

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * ProgressBar
 * Displays a progress bar with optional label and percentage.
 * Used for showing utilization rates, satisfaction scores, etc.
 */
export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = "blue",
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
          {showPercentage && <span className="text-sm font-semibold text-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-300", COLOR_CLASSES[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
