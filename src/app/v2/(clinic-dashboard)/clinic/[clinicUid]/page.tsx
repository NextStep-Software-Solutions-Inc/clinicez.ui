import { getCachedSession } from "@/actions/session.action";
import { getClinicDashboardDataAction } from "@/actions/clinics/clinic-dashboard.action";
import { ClinicDashboardClient } from "@/components/v2/dashboard/ClinicDashboardClient";

interface ClinicDashboardPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicDashboardPage({
  params,
}: ClinicDashboardPageProps) {
  const { clinicUid } = await params;
  const session = await getCachedSession();

  // Fetch dashboard data from server action
  const dashboardResult = await getClinicDashboardDataAction(clinicUid);

  if (!dashboardResult.status || !dashboardResult.data) {
    throw new Error(dashboardResult.message);
  }

  // Extract user's first name for greeting
  const userName = session?.user?.given_name || "Doctor";

  return (
    <ClinicDashboardClient
      clinicUid={clinicUid}
      data={dashboardResult.data}
      userName={userName}
    />
  );
}
