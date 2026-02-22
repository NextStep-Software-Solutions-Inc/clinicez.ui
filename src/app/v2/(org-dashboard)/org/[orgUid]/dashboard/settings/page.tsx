import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { getOrgSettingAction } from "@/actions/organizations/org-setting.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { getOrganizationRolesAction } from "@/actions/organizations/organization-role.action";
import { getPermissionsAction } from "@/actions/permission.action";
import { getOrgDepartmentAction } from "@/actions/organizations/org-department.action";
import { getOrgCollegesAction } from "@/actions/organizations/org-college.action";
import { getOrgProgramsAction } from "@/actions/organizations/org-program.action";
import { getOrgOfficesAction } from "@/actions/organizations/org-office.action";
import { getOrganizationYearLevelsAction } from "@/actions/organizations/org-year-level.action";
import { getOrganizationClinics } from "@/actions/organizations/organization-clinics.action";
import { getOrgOnboardingRequirementsAction } from "@/actions/onboarding.action";
import { OrgSettingsClient } from "@/components/v2/settings/OrgSettingsClient";

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
    orgSettingResult,
    membersResult,
    rolesResult,
    allOrgPermissions,
    departments,
    colleges,
    programs,
    offices,
    yearLevels,
    clinics,
  ] = await Promise.all([
    getOrganizationAction(orgUid),
    getOrgSettingAction(orgUid),
    getOrgMembersAction({ orgUid, pageSize: 100 }),
    getOrganizationRolesAction({ orgUid }),
    getPermissionsAction({ type: "ORGANIZATION" }),
    getOrgDepartmentAction(orgUid),
    getOrgCollegesAction(orgUid),
    getOrgProgramsAction(orgUid),
    getOrgOfficesAction(orgUid),
    getOrganizationYearLevelsAction(orgUid),
    getOrganizationClinics(orgUid),
  ]);

  if (!org) {
    notFound();
  }

  const onboardingResult = await getOrgOnboardingRequirementsAction({
    organizationId: org.id,
  });

  return (
    <OrgSettingsClient
      orgUid={orgUid}
      org={org}
      orgSetting={orgSettingResult.data ?? null}
      members={membersResult.data?.data ?? []}
      roles={rolesResult.data ?? []}
      allOrgPermissions={allOrgPermissions}
      departments={departments}
      colleges={colleges}
      programs={programs}
      offices={offices}
      yearLevels={yearLevels}
      clinics={clinics}
      onboardingRequirements={onboardingResult.data ?? []}
    />
  );
}
