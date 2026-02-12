import React from "react";
import "@styles/v2-dashboard.css";
import { V2DashboardShell } from "@/components/v2/dashboard";
import type { V2NavItem } from "@/components/v2/dashboard";

interface ClinicDashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicDashboardLayout(
  props: ClinicDashboardLayoutProps,
) {
  const params = await props.params;
  const { clinicUid } = params;

  const navItems: V2NavItem[] = [
    { name: "Dashboard", href: `/clinic/${clinicUid}/dashboard`, icon: "home" },
    {
      name: "Patients",
      href: `/clinic/${clinicUid}/dashboard/patients`,
      icon: "users",
    },
    {
      name: "Appointments",
      href: `/clinic/${clinicUid}/dashboard/appointments`,
      icon: "calendar",
    },
    {
      name: "Consultations",
      href: `/clinic/${clinicUid}/dashboard/consultations`,
      icon: "stethoscope",
    },
    {
      name: "Records",
      href: `/clinic/${clinicUid}/dashboard/records`,
      icon: "file-text",
    },
    {
      name: "Analytics",
      href: `/clinic/${clinicUid}/dashboard/analytics`,
      icon: "bar-chart",
    },
    {
      name: "Settings",
      href: `/clinic/${clinicUid}/dashboard/settings`,
      icon: "settings",
    },
  ];

  return (
    <V2DashboardShell
      dashboardType="clinic"
      title="Clinic Dashboard"
      navItems={navItems}
    >
      {props.children}
    </V2DashboardShell>
  );
}
