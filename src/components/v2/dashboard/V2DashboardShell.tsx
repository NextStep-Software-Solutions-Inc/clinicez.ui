"use client";

import React from "react";
import "@styles/v2-dashboard.css";
import V2DashboardSidebar, {
  V2MobileMenu,
  type V2NavItem,
} from "./V2DashboardSidebar";
import V2DashboardTopbar from "./V2DashboardTopbar";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type V2DashboardType = "patient" | "tenant" | "clinic" | "organization";

export interface V2DashboardShellProps {
  dashboardType: V2DashboardType;
  navItems: V2NavItem[];
  title: string;
  subtitle?: string;
  /** Right-side topbar actions (e.g. user avatar dropdown) */
  topbarActions?: React.ReactNode;
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function V2DashboardShell({
  dashboardType,
  navItems,
  title,
  subtitle,
  topbarActions,
  children,
}: V2DashboardShellProps) {
  return (
    <div
      data-dashboard={dashboardType}
      className="flex min-h-dvh bg-background"
    >
      {/* Desktop sidebar */}
      <V2DashboardSidebar
        navItems={navItems}
        dashboardType={dashboardType}
        title={title}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <V2DashboardTopbar
          title={title}
          subtitle={subtitle}
          mobileMenuTrigger={
            <V2MobileMenu
              navItems={navItems}
              dashboardType={dashboardType}
              title={title}
            />
          }
        >
          {topbarActions}
        </V2DashboardTopbar>

        <main className="v2-content">{children}</main>
      </div>
    </div>
  );
}
