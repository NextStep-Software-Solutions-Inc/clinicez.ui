import { isOrgMember, canViewOrgMembers, isOrgHealthcareProvider } from "@lib/org-utils";
import OrgAnalytics from "./OrgAnalytics";
import ConditionalRender from "@components/utils/ConditionalRender";


export const OrgMembershipAnalytics = async ({ orgUid }: { orgUid: string; }) => {
  const [member, canView, hp] = await Promise.all([
    isOrgMember(orgUid),
    canViewOrgMembers(orgUid),
    isOrgHealthcareProvider(orgUid),
  ]);
  return (
    <ConditionalRender condition={(member && hp) || canView}>
      <OrgAnalytics orgUid={orgUid} />
    </ConditionalRender>
  );
};
