import { getCachedSession } from "@/actions/session.action";
import { getOrgDashboardDataAction } from "@/actions/organizations/org-dashboard.action";
import { OrgDashboardClient } from "@/components/v2/dashboard/OrgDashboardClient";
import prisma from "@lib/prisma";

interface OrgDashboardPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function OrgDashboardPage({ params }: OrgDashboardPageProps) {
  const { orgUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("User not authenticated");
  }

  const dashboardResult = await getOrgDashboardDataAction(orgUid);

  if (!dashboardResult.status || !dashboardResult.data) {
    throw new Error(dashboardResult.message ?? "Failed to load organization dashboard");
  }

  // Fetch user name for greeting
  const user = await prisma.user.findUnique({
    where: { userId: session.user.sub },
    select: {
      firstName: true,
      lastName: true,
      UserDefaultOrganizationRoles: {
        where: {
          Organization: { orgUid },
        },
        select: {
          OrganizationRole: {
            select: { name: true },
          },
        },
        take: 1,
      },
    },
  });

  const userName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : session.user.given_name ?? "Administrator";

  const orgRole =
    user?.UserDefaultOrganizationRoles?.[0]?.OrganizationRole?.name;

  return (
    <OrgDashboardClient
      orgUid={orgUid}
      data={dashboardResult.data}
      userName={userName}
      orgRole={orgRole}
    />
  );
}
