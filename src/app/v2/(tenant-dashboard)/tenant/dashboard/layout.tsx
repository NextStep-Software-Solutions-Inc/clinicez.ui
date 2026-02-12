import React from "react";
import "@styles/v2-dashboard.css";
import { V2DashboardShell } from "@/components/v2/dashboard";
import type { V2NavItem } from "@/components/v2/dashboard";

const navItems: V2NavItem[] = [
  { name: "Dashboard", href: "/tenant/dashboard", icon: "home" },
  {
    name: "Organizations",
    href: "/tenant/dashboard/organizations",
    icon: "building",
  },
  { name: "Clinics", href: "/tenant/dashboard/clinics", icon: "stethoscope" },
  { name: "Users", href: "/tenant/dashboard/users", icon: "users" },
  {
    name: "Analytics",
    href: "/tenant/dashboard/analytics",
    icon: "bar-chart",
  },
  { name: "Settings", href: "/tenant/dashboard/settings", icon: "settings" },
];

interface TenantDashboardLayoutProps {
  children: React.ReactNode;
}

export default function TenantDashboardLayout({
  children,
}: TenantDashboardLayoutProps) {
  return (
    <V2DashboardShell
      dashboardType="tenant"
      title="Tenant Console"
      navItems={navItems}
    >
      {children}
    </V2DashboardShell>
  );
}
