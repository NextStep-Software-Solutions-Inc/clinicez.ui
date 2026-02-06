import Suspend from "@components/Suspend";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getOrganizationAction } from "@actions/organizations/organization.action";
import { canViewOrgMembers, isOrgHealthcareProvider, isOrgOwner } from "@/lib/org-utils";

import { OrganizationReportsFilters } from "./OrganizationReportsFilters";

interface OrganizationReportsProps {
  orgUid: string;
}

export const OrganizationReports = async ({ orgUid }: OrganizationReportsProps) => {
  const [owner, canView, healthcareProviderMember, organization] = await Promise.all([
    isOrgOwner(orgUid),
    canViewOrgMembers(orgUid),
    isOrgHealthcareProvider(orgUid),
    getOrganizationAction(orgUid),
  ]);

  const canViewReports = Boolean(organization && (owner || canView || healthcareProviderMember));

  return (
    <ConditionalRender condition={canViewReports}>
      <div className="space-y-6">
        <Suspend>
          {organization && (
            <OrganizationReportsFilters orgUid={orgUid} />
          )}
        </Suspend>
      </div>
    </ConditionalRender>
  );
};
