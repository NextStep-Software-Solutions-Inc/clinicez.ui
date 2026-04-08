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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 20;

const VALID_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING", "INACTIVE"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export default async function OrgMembersPage({ params, searchParams }: OrgMembersPageProps) {
  const { orgUid } = await params;
  const sp = await searchParams;

  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("User not authenticated");
  }

  const statusParam = typeof sp.status === "string" ? sp.status : undefined;
  const statusFilter: ValidStatus | undefined = VALID_STATUSES.includes(statusParam as ValidStatus)
    ? (statusParam as ValidStatus)
    : undefined;
  const searchKey = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  const roleFilter = typeof sp.role === "string" && sp.role !== "ALL" ? sp.role : undefined;

  const [membersResult, rolesResult] = await Promise.all([
    getOrgMembersAction({
      orgUid,
      pageSize: PAGE_SIZE,
      pageNumber: 1,
      ...(statusFilter ? { status: [statusFilter] } : {}),
      ...(searchKey ? { searchKey } : {}),
      ...(roleFilter ? { role: [roleFilter] } : {}),
    }),
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
        initialNextCursor={membersResult.data?.nextCursor ?? null}
        initialHasMore={membersResult.data?.hasMore ?? false}
        roles={rolesResult.data ?? []}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
