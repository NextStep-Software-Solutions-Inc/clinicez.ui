import React from "react";
import "@styles/v2-dashboard.css";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { notFound } from "next/navigation";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgUid } = await params;

  const org = await getOrganizationAction(orgUid);
  if (!org) notFound();

  const navItems: NavItem[] = [
    { name: "Dashboard", href: `/v2/orgs/${orgUid}`, icon: "home", exact: true },
    { name: "Members", href: `/v2/orgs/${orgUid}/members`, icon: "users" },
    { name: "Clinics", href: `/v2/orgs/${orgUid}/clinics`, icon: "building" },
    { name: "Reports", href: `/v2/orgs/${orgUid}/reports`, icon: "bar-chart" },
    { name: "Settings", href: `/v2/orgs/${orgUid}/settings`, icon: "settings" },
  ];

  return (
    <DashboardShell
      dashboardType="organization"
      title={org.name}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
