import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { AppRouterPageRouteOpts } from "@/types";
import OrgSettings from "@/components/organization/OrgSettings";
import { canManageOrgMembers, canManageOrgPermissions, canUpdateOrgInfo, isOrgMember } from "@lib/org-utils";

export const metadata: Metadata = {
  title: "Organization Settings",
  description: "Configure your organization settings",
}

export default async function OrgSettingsPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const organization = String(params?.orgUid)
  
  // Check permissions for different tabs
  const [isMember, canUpdateInfo, canManageMembers, canManagePerms] = await Promise.all([
    isOrgMember(organization),
    canUpdateOrgInfo(organization),
    canManageOrgMembers(organization),
    canManageOrgPermissions(organization)
  ]);
  
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {`Configure your organization settings. This includes your organization's profile, settings, and more.`}
          </p>
        </div>
        <Separator />
        <Suspend>
          <OrgSettings 
            isMember={isMember}
            canUpdateInfo={canUpdateInfo}
            canManageMembers={canManageMembers}
            canManagePerms={canManagePerms}
          />
        </Suspend>
      </div>
    
    </>
  );
}
