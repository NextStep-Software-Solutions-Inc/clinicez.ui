"use client";

import React from "react";
import { cn } from "@lib/utils";
import { Input } from "@components/ui/input";
import { Search } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface V2DashboardTopbarProps {
  title: string;
  subtitle?: string;
  /** Right-side actions (e.g. user avatar dropdown) */
  children?: React.ReactNode;
  /** Mobile menu trigger rendered from the sidebar Sheet */
  mobileMenuTrigger?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function V2DashboardTopbar({
  title,
  subtitle,
  children,
  mobileMenuTrigger,
}: V2DashboardTopbarProps) {
  return (
    <header className="v2-topbar">
      {/* Left section: mobile trigger + breadcrumb area */}
      <div className="flex items-center gap-3">
        {mobileMenuTrigger}
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Center: search */}
      <div className="mx-4 hidden max-w-sm flex-1 md:block">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className={cn("h-8 pl-8 text-sm")}
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
