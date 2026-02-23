import type { Metadata } from "next";
import { getOrgReportsAction } from "@/actions/organizations/org-reports.action";
import { getCachedSession } from "@/actions/session.action";
import { OrgReportsClient } from "@/components/v2/org/reports/OrgReportsClient";
import { getDateRangeFromParams } from "@/lib/report-period-utils";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Organization reporting — members, registrations, roles, structure",
};

export const dynamic = "force-dynamic";

interface OrgReportsPageProps {
  params: Promise<{ orgUid: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function OrgReportsPage({
  params,
  searchParams,
}: OrgReportsPageProps) {
  const { orgUid } = await params;
  const { period, from: fromStr, to: toStr } = await searchParams;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const { from, to } = getDateRangeFromParams(period, fromStr, toStr);

  const result = await getOrgReportsAction({ orgUid, from, to });

  if (!result.status || !result.data) {
    throw new Error(result.message);
  }

  return (
    <OrgReportsClient
      orgUid={orgUid}
      initialData={result.data}
      initialPeriod={period ?? "month"}
      initialFrom={fromStr}
      initialTo={toStr}
    />
  );
}
