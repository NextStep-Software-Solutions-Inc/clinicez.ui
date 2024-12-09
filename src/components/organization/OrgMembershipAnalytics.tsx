import { isOrgMember, isOrgAdmin } from "@lib/org-utils";
import OrgAnalytics from "./OrgAnalytics";
import ConditionalRender from "@components/utils/ConditionalRender";


export const OrgMembershipAnalytics = async ({ orgUid }: { orgUid: string; }) => {
  const [member, orgAdmin] = await Promise.all([
    isOrgMember(),
    isOrgAdmin(orgUid)
  ]);
  return (
    <ConditionalRender condition={member && orgAdmin}>
      <OrgAnalytics orgUid={orgUid} />
    </ConditionalRender>
  );
};
