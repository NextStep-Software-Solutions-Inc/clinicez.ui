import OrganizationListShell from "@/components/v2/org/OrganizationListShell";
import HeaderTitle from "@/components/HeaderTitle";
import { getOrganizationsV2Action } from "@/actions/organizations/organization.action";
import { getMyOrgMembershipsAction } from "@/actions/organizations/org-member.action";
import Suspend from "@/components/Suspend";
import HeroBackground from "@/components/HeroBackground";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const [orgs, membershipsResult] = await Promise.all([
    getOrganizationsV2Action({ isPublic: true }),
    getMyOrgMembershipsAction(),
  ]);

  const membershipStatusMap = Object.fromEntries(
    (membershipsResult.data ?? []).map((m) => [m.orgUid, m.status])
  );

  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl space-y-8">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <HeaderTitle
        header={[{ text: "Organizations", className: "text-primary" }]}
        description="Browse our list of organizations that you can join and find clinics/hospitals affiliations."
        className="text-center"
      />
      <Suspend>
        <OrganizationListShell data={orgs} membershipStatusMap={membershipStatusMap} />
      </Suspend>
    </div>
  );
}
