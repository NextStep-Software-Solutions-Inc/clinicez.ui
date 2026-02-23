import React from "react";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getOrganizationAction, getUserOrgsWithRolesAction } from "@/actions/organizations/organization.action";
import { notFound } from "next/navigation";

interface OrgUidLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgUidLayout(props: OrgUidLayoutProps) {
  const { orgUid } = await props.params;

  const [organization, userOrgsResult] = await Promise.all([
    getOrganizationAction(orgUid),
    getUserOrgsWithRolesAction(),
  ]);

  if (!organization) {
    notFound();
  }

  const userOrgs = userOrgsResult.data ?? [];

  const navItems: NavItem[] = [
    {
      name: "Overview",
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
      name: "Activities",
      href: `/v2/orgs/${orgUid}/activities`,
      icon: "activity",
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

  // Find the current user's role in this org from their memberships
  const currentOrgMembership = userOrgs.find((o) => o.orgUid === orgUid);

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
          activeOrg={{
            id: organization.id,
            name: organization.name,
            orgUid: organization.orgUid,
            role: currentOrgMembership?.role,
          }}
          orgs={userOrgs.map((o) => ({
            id: o.id,
            name: o.name,
            orgUid: o.orgUid,
            role: o.role,
          }))}
          headerActions={null}
        >
          {props.children}
        </DashboardShell>
      </div>
    </div>
  );
}
