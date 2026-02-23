import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { getOrganizationRolesAction } from "@/actions/organizations/organization-role.action";
import { getOrgCollegesAction } from "@/actions/organizations/org-college.action";
import { getOrgDepartmentAction } from "@/actions/organizations/org-department.action";
import { getOrgProgramsAction } from "@/actions/organizations/org-program.action";
import { getOrganizationYearLevelsAction } from "@/actions/organizations/org-year-level.action";
import { getOrgOfficesAction } from "@/actions/organizations/org-office.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { OrgSettingsClient } from "@/components/v2/org/OrgSettingsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure organization settings and preferences",
};

interface OrgSettingsPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function OrgSettingsPage({ params }: OrgSettingsPageProps) {
  const { orgUid } = await params;

  const [
    org,
    rolesResult,
    colleges,
    departments,
    programs,
    yearLevels,
    offices,
    membersResult,
  ] = await Promise.all([
    getOrganizationAction(orgUid),
    getOrganizationRolesAction({ orgUid }),
    getOrgCollegesAction(orgUid),
    getOrgDepartmentAction(orgUid),
    getOrgProgramsAction(orgUid),
    getOrganizationYearLevelsAction(orgUid),
    getOrgOfficesAction(orgUid),
    getOrgMembersAction({ orgUid }),
  ]);

  if (!org) notFound();

  return (
    <OrgSettingsClient
      orgUid={orgUid}
      org={org}
      roles={rolesResult.data ?? []}
      colleges={colleges}
      departments={departments}
      programs={programs}
      yearLevels={yearLevels}
      offices={offices}
      members={membersResult.data?.data ?? []}
    />
  );
}
