
import { Container } from "lucide-react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import ConditionalRender from "./utils/ConditionalRender";
import { getSession } from "@auth0/nextjs-auth0";
import { getMyDefaultOrganizationAction } from "@actions/organization.action";
import { redirect } from "next/navigation";
import { isHP, isMember } from "@lib/protect-org";

export default async function DashboardLink(){
  const session = await getSession();
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
