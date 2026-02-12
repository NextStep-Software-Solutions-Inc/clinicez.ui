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
        "v2-stat-card v2-animate-slide-up border shadow-sm",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="v2-stat-card__label">{label}</p>
          <p className="v2-stat-card__value">{value}</p>
          {trend && (
            <span
              className={cn(
                "v2-stat-card__trend",
                trend.direction === "up"
                  ? "v2-stat-card__trend--up"
                  : "v2-stat-card__trend--down",
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
