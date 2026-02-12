"use client";

import React from "react";
import "@styles/v2-dashboard.css";
import DashboardSidebar, {
  MobileMenu,
  type NavItem,
} from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DashboardType = "patient" | "tenant" | "clinic" | "organization";

export interface DashboardShellProps {
  dashboardType: DashboardType;
  navItems: NavItem[];
  title: string;
  subtitle?: string;
  /** Right-side topbar actions (e.g. user avatar dropdown) */
  topbarActions?: React.ReactNode;
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardShell({
  dashboardType,
  navItems,
  title,
  subtitle,
  topbarActions,
  children,
}: DashboardShellProps) {
  return (
    <div
      data-dashboard={dashboardType}
      className="flex min-h-dvh bg-background"
    >
      {/* Desktop sidebar */}
      <DashboardSidebar
        navItems={navItems}
        dashboardType={dashboardType}
        title={title}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <DashboardTopbar
          title={title}
          subtitle={subtitle}
          mobileMenuTrigger={
            <MobileMenu
              navItems={navItems}
              dashboardType={dashboardType}
              title={title}
            />
          }
        >
          {topbarActions}
        </DashboardTopbar>

        <main className="v2-content">{children}</main>
      </div>
    </div>
  );
}
