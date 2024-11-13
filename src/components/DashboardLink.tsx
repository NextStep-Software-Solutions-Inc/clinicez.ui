
import { Container } from "lucide-react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import ConditionalRender from "./utils/ConditionalRender";
import { getMyDefaultOrganizationAction } from "@actions/organizations/organization.action";
import { isHP, isMember } from "@lib/protect-org";

export default async function DashboardLink(){
  const [hp, member, defaultOrg] = await Promise.all([isHP(), isMember(), getMyDefaultOrganizationAction()]);

  return (
    <ConditionalRender condition={hp || member}>
      <a {...!defaultOrg ? { href:`/settings/organizations` }:{ href:`/organizations/${defaultOrg.data?.Organization.orgUid}/dashboard` }}>
        <DropdownMenuItem>
          <Container className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
      </a>
    </ConditionalRender>
  );
};
