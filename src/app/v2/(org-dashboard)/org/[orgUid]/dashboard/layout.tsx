import React from "react";
import "@styles/v2-dashboard.css";
import { V2DashboardShell } from "@/components/v2/dashboard";
import type { V2NavItem } from "@/components/v2/dashboard";

interface OrgDashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgDashboardLayout(
  props: OrgDashboardLayoutProps,
) {
  const params = await props.params;
  const { orgUid } = params;

  const navItems: V2NavItem[] = [
    { name: "Dashboard", href: `/org/${orgUid}/dashboard`, icon: "home" },
    {
      name: "Members",
      href: `/org/${orgUid}/dashboard/members`,
      icon: "users",
    },
    {
      name: "Clinics",
      href: `/org/${orgUid}/dashboard/clinics`,
      icon: "building",
    },
    {
      name: "Activity",
      href: `/org/${orgUid}/dashboard/activity`,
      icon: "activity",
    },
    {
      name: "Reports",
      href: `/org/${orgUid}/dashboard/reports`,
      icon: "bar-chart",
    },
    {
      name: "Settings",
      href: `/org/${orgUid}/dashboard/settings`,
      icon: "settings",
    },
  ];

  return (
    <V2DashboardShell
      dashboardType="organization"
      title="Organization Hub"
      navItems={navItems}
    >
      {props.children}
    </V2DashboardShell>
  );
}
