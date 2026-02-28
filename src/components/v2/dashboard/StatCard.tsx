import React from "react";
import { cn } from "@lib/utils";
import { Card, CardContent } from "@components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; value: string };
  icon?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StatCard({
  label,
  value,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border shadow-sm transition-all hover:shadow-md animate-slide-up",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.direction === "up"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
