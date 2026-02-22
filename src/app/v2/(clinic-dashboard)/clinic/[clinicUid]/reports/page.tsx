import type { Metadata } from "next";
import { getClinicReportsAction } from "@/actions/clinics/clinic-reports.action";
import { getCachedSession } from "@/actions/session.action";
import { ClinicReportsClient } from "@/components/v2/clinic/reports/ClinicReportsClient";
import { getDateRangeFromParams } from "@/lib/report-period-utils";

export const metadata: Metadata = {
  title: "Reports",
  description: "Clinic reporting — appointments, consultations, service availment, patients, and diagnostics",
};

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  params: Promise<{ clinicUid: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function ClinicReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const { clinicUid } = await params;
  const { period, from: fromStr, to: toStr } = await searchParams;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  const { from, to } = getDateRangeFromParams(period, fromStr, toStr);

  const result = await getClinicReportsAction({ clinicUid, from, to });

  if (!result.status || !result.data) {
    throw new Error(result.message);
  }

  return (
    <ClinicReportsClient
      clinicUid={clinicUid}
      initialData={result.data}
      initialPeriod={period ?? "month"}
      initialFrom={fromStr}
      initialTo={toStr}
    />
  );
}
