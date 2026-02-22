import type { Metadata } from "next";
import { getClinicAnalyticsAction } from "@/actions/clinics/clinic-analytics.action";
import { ClinicAnalyticsClient } from "@/components/v2/analytics/ClinicAnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Comprehensive clinic analytics and statistics",
};

interface AnalyticsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicAnalyticsPage({ params }: AnalyticsPageProps) {
  const { clinicUid } = await params;

  const result = await getClinicAnalyticsAction(clinicUid);

  if (!result.status || !result.data) {
    throw new Error(result.message ?? "Failed to load analytics data");
  }

  return <ClinicAnalyticsClient data={result.data} />;
}
