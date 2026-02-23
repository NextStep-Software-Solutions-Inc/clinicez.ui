import type { Metadata } from "next";
import { getCachedSession } from "@/actions/session.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { getOrganizationRolesAction } from "@/actions/organizations/organization-role.action";
import { OrgMembersClient } from "@/components/v2/org/OrgMembersClient";

export const metadata: Metadata = {
  title: "Members",
  description: "View and manage organization members",
};

export const dynamic = "force-dynamic";

interface OrgMembersPageProps {
  params: Promise<{ orgUid: string }>;
}

const PAGE_SIZE = 20;

export default async function OrgMembersPage({ params }: OrgMembersPageProps) {
  const { orgUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("User not authenticated");
  }

  const [membersResult, rolesResult] = await Promise.all([
    getOrgMembersAction({ orgUid, pageSize: PAGE_SIZE, pageNumber: 1 }),
    getOrganizationRolesAction({ orgUid }),
  ]);

  if (!membersResult.status) {
    throw new Error(membersResult.message ?? "Failed to load organization members");
  }

  return (
    <div className="space-y-0 pb-10">
      <OrgMembersClient
        orgUid={orgUid}
        initialMembers={membersResult.data?.data ?? []}
        initialTotal={membersResult.data?.total ?? 0}
        roles={rolesResult.data ?? []}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
