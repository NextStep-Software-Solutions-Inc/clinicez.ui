import { getCachedSession } from "@/actions/session.action";
import { getClinicDashboardDataAction } from "@/actions/clinics/clinic-dashboard.action";
import { ClinicDashboardClient } from "@/components/v2/dashboard/ClinicDashboardClient";
import prisma from "@lib/prisma";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";

export const dynamic = "force-dynamic";

interface ClinicDashboardPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicDashboardPage({
  params,
}: ClinicDashboardPageProps) {
  const { clinicUid } = await params;
  const session = await getCachedSession();

  if (!session?.user?.sub) {
    return <UnauthorizedWarning />;
  }

  // Fetch dashboard data from server action
  const dashboardResult = await getClinicDashboardDataAction(clinicUid);

  if (!dashboardResult.status || !dashboardResult.data) {
    if (dashboardResult.message?.toLowerCase().includes('permission')) {
      return <UnauthorizedWarning />;
    }
    throw new Error(dashboardResult.message);
  }

  // Fetch healthcare provider profile with title if available
  const user = await prisma.user.findUnique({
    where: { userId: session.user.sub },
    select: {
      HealthcareProvider: {
        select: {
          HPProfile: {
            select: {
              title: true,
              name: true,
            },
          },
        },
      },
      UserDefaultClinicRoles: {
        where: {
          Clinic: { clinicUid },
        },
        select: {
          ClinicRole: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  // Extract user's first name for greeting
  const userName = user?.HealthcareProvider?.HPProfile?.name || session?.user?.given_name || "Staff";

  // Determine professional title: HPProfile title > Clinic role > undefined
  let professionalTitle: string | undefined;
  if (user?.HealthcareProvider?.HPProfile?.title) {
    professionalTitle = user.HealthcareProvider.HPProfile.title;
  } else if (user?.UserDefaultClinicRoles?.[0]?.ClinicRole?.name) {
    professionalTitle = user.UserDefaultClinicRoles[0].ClinicRole.name;
  }

  return (
    <ClinicDashboardClient
      clinicUid={clinicUid}
      data={dashboardResult.data}
      userName={userName}
      professionalTitle={professionalTitle}
    />
  );
}
