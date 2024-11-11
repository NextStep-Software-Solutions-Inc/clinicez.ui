
import { Container } from "lucide-react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import ConditionalRender from "./utils/ConditionalRender";
import { getMyDefaultOrganizationAction } from "@actions/organizations/organization.action";
import { redirect } from "next/navigation";
import { isHP, isMember } from "@lib/protect-org";
import { getCachedSession } from "@actions/session.action";

export default async function DashboardLink(){
  const session = await getCachedSession();
  if(!session) return redirect("/api/auth/login");
  const defaultOrg = await getMyDefaultOrganizationAction(session.user.sub);

  return (
    <ConditionalRender condition={await isHP() || await isMember()}>
      <a {...!defaultOrg ? { href:`/settings/organizations` }:{ href:`/${defaultOrg?.Organization.orgId}/dashboard` }}>
        <DropdownMenuItem>
          <Container className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
      </a>
    </ConditionalRender>
  );
};
