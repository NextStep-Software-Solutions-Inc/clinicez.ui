import React from "react";
import "@styles/v2-dashboard.css";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { NotificationBell } from "@/components/v2/notifications/NotificationBell";

const navItems: NavItem[] = [
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
    <DashboardShell
      dashboardType="tenant"
      title="Tenant Console"
      navItems={navItems}
      headerActions={<NotificationBell />}
    >
      {children}
    </DashboardShell>
  );
}
