import { getCachedSession } from "@/actions/session.action";
import { getOrgClinicsAction } from "@/actions/organizations/org-clinics.action";
import { OrgClinicsClient } from "@/components/v2/org/clinics/OrgClinicsClient";
import { getOrganizationAction } from "@/actions/organizations/organization.action";
import prisma from "@lib/prisma";

interface OrgClinicsPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function OrgClinicsPage({ params }: OrgClinicsPageProps) {
  const { orgUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("User not authenticated");
  }

  const [clinicsResult, organization] = await Promise.all([
    getOrgClinicsAction(orgUid),
    getOrganizationAction(orgUid),
  ]);

  if (!clinicsResult.status || !clinicsResult.data) {
    throw new Error(clinicsResult.message ?? "Failed to load organization clinics");
  }

  if (!organization) {
    throw new Error("Organization not found");
  }

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
      : (session.user.given_name ?? "Administrator");

  const orgRole =
    user?.UserDefaultOrganizationRoles?.[0]?.OrganizationRole?.name;

  return (
    <OrgClinicsClient
      orgUid={orgUid}
      data={clinicsResult.data}
      orgName={organization.name}
      userName={userName}
      orgRole={orgRole}
    />
  );
}
