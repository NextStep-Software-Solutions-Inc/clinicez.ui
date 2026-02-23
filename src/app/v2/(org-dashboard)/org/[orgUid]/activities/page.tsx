import type { Metadata } from "next";
import { getOrgActivitiesAction } from "@/actions/organizations/org-activities.action";
import { getCachedSession } from "@/actions/session.action";
import { OrgActivitiesClient } from "@/components/v2/org/activities/OrgActivitiesClient";

export const metadata: Metadata = {
  title: "Activities",
  description: "Organization activity log — member events, permission changes, and system actions",
};

export const dynamic = "force-dynamic";

interface OrgActivitiesPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function OrgActivitiesPage({ params }: OrgActivitiesPageProps) {
  const { orgUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const result = await getOrgActivitiesAction({ orgUid, pageSize: 25 });

  if (!result.status || !result.data) {
    throw new Error(result.message ?? "Failed to load organization activities");
  }

  const { org, items, total, hasMore, nextCursor } = result.data;

  return (
    <OrgActivitiesClient
      orgUid={orgUid}
      org={org}
      initialItems={items}
      initialTotal={total}
      initialHasMore={hasMore}
      initialNextCursor={nextCursor}
    />
  );
}
