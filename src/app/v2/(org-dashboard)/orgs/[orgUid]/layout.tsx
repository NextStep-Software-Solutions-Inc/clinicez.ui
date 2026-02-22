import React from "react";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { notFound } from "next/navigation";

interface OrgDashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgUidLayout(props: OrgDashboardLayoutProps) {
  const params = await props.params;
  const { orgUid } = params;

  const org = await getOrganizationAction(orgUid);
  if (!org) notFound();

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: `/v2/orgs/${orgUid}`,
      icon: "home",
      exact: true,
    },
    {
      name: "Members",
      href: `/v2/orgs/${orgUid}/members`,
      icon: "users",
    },
    {
      name: "Clinics",
      href: `/v2/orgs/${orgUid}/clinics`,
      icon: "building",
    },
    {
      name: "Reports",
      href: `/v2/orgs/${orgUid}/reports`,
      icon: "bar-chart",
    },
    {
      name: "Settings",
      href: `/v2/orgs/${orgUid}/settings`,
      icon: "settings",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, hsl(var(--color-border) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--color-border) / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          backgroundPosition: "0 0",
          zIndex: 0,
        }}
      />
      <div className="relative z-10">
        <DashboardShell
          dashboardType="organization"
          title={org.name}
          subtitle="Organization Dashboard"
          headerActions={null}
          navItems={navItems}
        >
          {props.children}
        </DashboardShell>
      </div>
    </div>
  );
}
