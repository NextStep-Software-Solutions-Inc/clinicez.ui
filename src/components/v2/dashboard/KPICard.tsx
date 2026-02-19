import React from "react";
import { Card, CardContent } from "@components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend: {
    direction: "up" | "down";
    text: string;
  };
  progress: number; // percentage 0-100
  color: "primary" | "secondary" | "accent";
}

const colorMap = {
  primary: "--primary",
  secondary: "--secondary",
  accent: "--accent",
};

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  progress,
  color,
}: KPICardProps) {
  const cssVariable = colorMap[color];
  const trendIcon = trend.direction === "up" ? "↑" : "↓";

  return (
    <Card
      className="glassmorphic-card overflow-hidden border relative group hover:shadow-lg transition-all duration-300"
      style={{ borderColor: `hsl(var(--color-border-light))` }}
    >
      <CardContent className="p-2.5">
        <div className="flex flex-col gap-2">
          {/* Header with icon */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              {label}
            </p>
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
              style={{ background: `hsl(var(${cssVariable}) / 0.2)` }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: `hsl(var(${cssVariable}))` }}
              />
            </div>
          </div>

          {/* Main metric */}
          <div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p
              className="text-xs mt-0.5 font-medium flex items-center gap-1"
              style={{ color: `hsl(var(${cssVariable}))` }}
            >
              <span>{trendIcon}</span>
              <span>{trend.text}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: `hsl(var(--color-border-light))` }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, hsl(var(${cssVariable})), hsl(var(${cssVariable}) / 0.7))`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
