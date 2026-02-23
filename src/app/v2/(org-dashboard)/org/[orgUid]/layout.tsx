import React from "react";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getOrganizationAction, getUserOrgsWithRolesAction } from "@/actions/organizations/organization.action";
import { notFound } from "next/navigation";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgLayout(props: OrgLayoutProps) {
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

  // Find the current user's role in this org from their memberships
  const currentOrgMembership = userOrgs.find((o) => o.orgUid === orgUid);

  // Only org members are allowed to access this dashboard
  if (!currentOrgMembership) {
    return <UnauthorizedWarning />;
  }

  return (
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
    >
      {props.children}
    </DashboardShell>
  );
}
