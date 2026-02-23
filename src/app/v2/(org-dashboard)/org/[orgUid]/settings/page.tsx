import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { getOrgSettingAction } from "@/actions/organizations/org-setting.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { getOrganizationRolesAction } from "@/actions/organizations/organization-role.action";
import { getPermissionsAction } from "@/actions/permission.action";
import { getOrgCollegesAction } from "@/actions/organizations/org-college.action";
import { getOrgDepartmentAction } from "@/actions/organizations/org-department.action";
import { getOrgProgramsAction } from "@/actions/organizations/org-program.action";
import { getOrgOfficesAction } from "@/actions/organizations/org-office.action";
import { getOrganizationYearLevelsAction } from "@/actions/organizations/org-year-level.action";
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
    orgSetting,
    members,
    roles,
    allOrgPermissions,
    colleges,
    departments,
    programs,
    offices,
    yearLevels,
  ] = await Promise.all([
    getOrganizationAction(orgUid),
    getOrgSettingAction(orgUid),
    getOrgMembersAction({ orgUid }),
    getOrganizationRolesAction({ orgUid }),
    getPermissionsAction({ type: "ORGANIZATION" }),
    getOrgCollegesAction(orgUid),
    getOrgDepartmentAction(orgUid),
    getOrgProgramsAction(orgUid),
    getOrgOfficesAction(orgUid),
    getOrganizationYearLevelsAction(orgUid),
  ]);

  if (!org) notFound();

  return (
    <OrgSettingsClient
      orgUid={orgUid}
      org={org}
      orgSetting={orgSetting.data ?? null}
      members={members.data ?? null}
      roles={roles.data ?? []}
      allOrgPermissions={allOrgPermissions}
      colleges={colleges}
      departments={departments}
      programs={programs}
      offices={offices}
      yearLevels={yearLevels}
    />
  );
}
