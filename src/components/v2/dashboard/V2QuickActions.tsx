import React from "react";
import Link from "next/link";
import { cn } from "@lib/utils";
import { Card, CardContent } from "@components/ui/card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface V2QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}

export interface V2QuickActionsProps {
  actions: V2QuickAction[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function V2QuickActions({
  actions,
  className,
}: V2QuickActionsProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 v2-stagger-children",
        className,
      )}
    >
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="group">
          <Card className="h-full transition-colors hover:border-[var(--dash-accent-border)] hover:shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-[var(--dash-accent-light)] group-hover:text-[var(--dash-accent)]">
                {action.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {action.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {action.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
