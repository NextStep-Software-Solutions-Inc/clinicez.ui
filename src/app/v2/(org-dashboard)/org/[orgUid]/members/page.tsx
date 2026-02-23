import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { getOrganizationRolesAction } from "@/actions/organizations/organization-role.action";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import { getPermissionsAction } from "@/actions/permission.action";
import { OrgMembersClient } from "@/components/v2/org/OrgMembersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Members",
  description: "Manage organization members",
};

interface OrgMembersPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function OrgMembersPage({ params }: OrgMembersPageProps) {
  const { orgUid } = await params;

  const [orgResult, membersResult, rolesResult, permissionsResult] =
    await Promise.all([
      getOrganizationAction(orgUid),
      getOrgMembersAction({ orgUid, pageSize: 100 }),
      getOrganizationRolesAction({ orgUid }),
      getPermissionsAction({ type: "ORGANIZATION" }),
    ]);

  if (!orgResult) notFound();

  return (
    <OrgMembersClient
      orgUid={orgUid}
      orgName={orgResult.name}
      initialMembers={membersResult.data?.data ?? []}
      totalCount={membersResult.data?.total ?? 0}
      roles={rolesResult.data ?? []}
      allPermissions={permissionsResult ?? []}
    />
  );
}
