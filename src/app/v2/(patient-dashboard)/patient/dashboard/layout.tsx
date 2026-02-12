import React from "react";
import "@styles/v2-dashboard.css";
import { V2DashboardShell } from "@/components/v2/dashboard";
import type { V2NavItem } from "@/components/v2/dashboard";

const navItems: V2NavItem[] = [
  { name: "Home", href: "/patient/dashboard", icon: "home" },
  { name: "Health Records", href: "/patient/dashboard/records", icon: "heart" },
  {
    name: "Appointments",
    href: "/patient/dashboard/appointments",
    icon: "calendar",
  },
  {
    name: "Prescriptions",
    href: "/patient/dashboard/prescriptions",
    icon: "clipboard",
  },
  { name: "My Profile", href: "/patient/dashboard/profile", icon: "users" },
  { name: "Settings", href: "/patient/dashboard/settings", icon: "settings" },
];

interface PatientDashboardLayoutProps {
  children: React.ReactNode;
}

export default function PatientDashboardLayout({
  children,
}: PatientDashboardLayoutProps) {
  return (
    <V2DashboardShell
      dashboardType="patient"
      title="Patient Portal"
      navItems={navItems}
    >
      {children}
    </V2DashboardShell>
  );
}
