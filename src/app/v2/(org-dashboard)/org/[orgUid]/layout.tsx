import React from "react";
import "@styles/v2-dashboard.css";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgLayout(props: OrgLayoutProps) {
  const params = await props.params;
  const { orgUid } = params;

  const navItems: NavItem[] = [
    { name: "Overview", href: `/v2/org/${orgUid}`, icon: "home", exact: true },
    {
      name: "Members",
      href: `/v2/org/${orgUid}/members`,
      icon: "users",
    },
    {
      name: "Clinics",
      href: `/v2/org/${orgUid}/clinics`,
      icon: "building",
    },
    {
      name: "Activities",
      href: `/v2/org/${orgUid}/activities`,
      icon: "activity",
    },
    {
      name: "Reports",
      href: `/v2/org/${orgUid}/reports`,
      icon: "bar-chart",
    },
    {
      name: "Settings",
      href: `/v2/org/${orgUid}/settings`,
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
