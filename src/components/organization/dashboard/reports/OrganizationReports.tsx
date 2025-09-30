import Suspend from "@components/Suspend";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getOrganizationAction } from "@actions/organizations/organization.action";
import { isOrgAdmin, isOrgHealthcareProvider, isOrgOwner } from "@/lib/org-utils";

import { OrganizationReportsFilters } from "./OrganizationReportsFilters";

interface OrganizationReportsProps {
  orgUid: string;
}

export const OrganizationReports = async ({ orgUid }: OrganizationReportsProps) => {
  const [owner, admin, healthcareProviderMember, organization] = await Promise.all([
    isOrgOwner(orgUid),
    isOrgAdmin(orgUid),
    isOrgHealthcareProvider(orgUid),
    getOrganizationAction(orgUid),
  ]);

  const canView = Boolean(organization && (owner || admin || healthcareProviderMember));

  return (
    <ConditionalRender condition={canView}>
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
