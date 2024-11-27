
import { LayoutDashboard } from "lucide-react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import ConditionalRender from "./utils/ConditionalRender";
import { getMyDefaultOrganizationAction } from "@actions/organizations/organization.action";
import { isHP, isOrgMember } from "@lib/org-utils";

export default async function OrgDashboardLink(){
  const [hp, member, defaultOrg] = await Promise.all([isHP(), isOrgMember(), getMyDefaultOrganizationAction()]);

  return (
    <ConditionalRender condition={hp || member}>
      <a {...!defaultOrg ? { href:`/settings/organizations` }:{ href:`/organizations/${defaultOrg.data?.Organization.orgUid}/dashboard` }}>
        <DropdownMenuItem>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Organization Dashboard
        </DropdownMenuItem>
      </a>
    </ConditionalRender>
  );
};
