import { isOrgMember, isOrgAdmin, isOrgHealthcareProvider } from "@lib/org-utils";
import OrgAnalytics from "./OrgAnalytics";
import ConditionalRender from "@components/utils/ConditionalRender";


export const OrgMembershipAnalytics = async ({ orgUid }: { orgUid: string; }) => {
  const [member, orgAdmin, hp] = await Promise.all([
    isOrgMember(orgUid),
    isOrgAdmin(orgUid),
    isOrgHealthcareProvider(orgUid),
  ]);
  return (
    <ConditionalRender condition={(member && hp) || orgAdmin}>
      <OrgAnalytics orgUid={orgUid} />
    </ConditionalRender>
  );
};
