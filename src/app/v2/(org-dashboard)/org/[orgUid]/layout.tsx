import React from "react";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { notFound } from "next/navigation";

interface OrgUidLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgUidLayout(props: OrgUidLayoutProps) {
  const { orgUid } = await props.params;

  const organization = await getOrganizationAction(orgUid);

  if (!organization) {
    notFound();
  }

  const navItems: NavItem[] = [
    {
      name: "Overview",
      href: `/v2/org/${orgUid}`,
      icon: "home",
      exact: true,
    },
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
      name: "Roles",
      href: `/v2/org/${orgUid}/roles`,
      icon: "clipboard",
    },
    {
      name: "Activity",
      href: `/v2/org/${orgUid}/activity`,
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Fixed mesh grid background */}
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
          title={organization.name}
          navItems={navItems}
          headerActions={null}
        >
          {props.children}
        </DashboardShell>
      </div>
    </div>
  );
}
