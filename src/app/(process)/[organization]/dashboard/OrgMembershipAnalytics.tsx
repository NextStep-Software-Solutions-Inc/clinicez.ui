import { isMember, isOrgAdmin } from "@lib/protect-org";
import OrgAnalytics from "./components/OrgAnalytics";
import ConditionalRender from "@components/utils/ConditionalRender";


export const OrgMembershipAnalytics = async ({ orgId }: { orgId: string; }) => {
  const [member, orgAdmin] = await Promise.all([
    isMember(),
    isOrgAdmin()
  ]);
  return (
    <ConditionalRender condition={member && orgAdmin}>
      <OrgAnalytics orgId={orgId} />
    </ConditionalRender>
  );
};
