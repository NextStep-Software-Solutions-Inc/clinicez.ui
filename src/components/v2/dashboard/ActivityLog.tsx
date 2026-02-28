import React from "react";
import { cn } from "@lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: React.ReactNode;
}

export interface ActivityLogProps {
  items: ActivityItem[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * ActivityLog
 * Displays a list of activities with consistent styling.
 * Used in dashboard to show recent clinic activities.
 */
export default function ActivityLog({ items, className }: ActivityLogProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-3 rounded-md border border-border p-3 transition-all hover:border-[var(--dash-accent-border)] hover:bg-[var(--dash-accent-muted)]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--dash-accent-light)] text-[var(--dash-accent)]">{activity.icon}</div>
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{activity.action}</p>
            <p className="text-xs text-muted-foreground">{activity.detail}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
        </div>
      ))}
    </div>
  );
}
