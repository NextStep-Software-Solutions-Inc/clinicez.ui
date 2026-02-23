import React from "react";
import "@styles/v2-dashboard.css";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { notFound } from "next/navigation";

interface OrgMembersLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgUid: string }>;
}

export default async function OrgMembersLayout(props: OrgMembersLayoutProps) {
  const params = await props.params;
  const { orgUid } = params;

  const org = await getOrganizationAction(orgUid);
  if (!org) notFound();

  const navItems: NavItem[] = [
    { name: "Dashboard", href: `/v2/org/${orgUid}/dashboard`, icon: "home" },
    { name: "Members", href: `/v2/org/${orgUid}/members`, icon: "users", exact: true },
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
          title={org.name}
          subtitle="Organization Management"
          navItems={navItems}
        >
          {props.children}
        </DashboardShell>
      </div>
    </div>
  );
}
