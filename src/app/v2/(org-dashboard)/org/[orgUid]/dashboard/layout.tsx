import React from "react";
import "@styles/v2-dashboard.css";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";

interface OrgDashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgDashboardLayout(
  props: OrgDashboardLayoutProps,
) {
  const params = await props.params;
  const { orgUid } = params;

  const navItems: NavItem[] = [
    { name: "Dashboard", href: `/v2/org/${orgUid}/dashboard`, icon: "home" },
    {
      name: "Members",
      href: `/v2/org/${orgUid}/members`,
      icon: "users",
    },
    {
      name: "Clinics",
      href: `/v2/org/${orgUid}/dashboard/clinics`,
      icon: "building",
    },
    {
      name: "Activity",
      href: `/v2/org/${orgUid}/dashboard/activity`,
      icon: "activity",
    },
    {
      name: "Reports",
      href: `/v2/org/${orgUid}/dashboard/reports`,
      icon: "bar-chart",
    },
    {
      name: "Settings",
      href: `/v2/org/${orgUid}/dashboard/settings`,
      icon: "settings",
    },
  ];

  return (
    <DashboardShell
      dashboardType="organization"
      title="Organization Hub"
      navItems={navItems}
    >
      {props.children}
    </DashboardShell>
  );
}
