"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import Each from "@components/utils/Each";
import OrgGeneralSettings from "../dashboard/org-settings/OrgGeneralSettings";
import OrganizationRolesSetting from "../dashboard/org-settings/OrgRolesSetting";
import OrgPermissionsSetting from "../dashboard/org-settings/OrgPermissionsSetting";
import OrgMembershipSettings from "../dashboard/org-settings/OrgMembershipSettings";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface OrgSettingsProps {
  isMember: boolean;
  canUpdateInfo: boolean;
  canManageMembers: boolean;
  canManagePerms: boolean;
}

export default function OrgSettings({ isMember, canUpdateInfo, canManageMembers, canManagePerms }: OrgSettingsProps) {
  // Define available tabs based on permissions
  const availableTabs = [
    ...(isMember ? ["general"] : []), // Members can view
    ...(canManageMembers ? ["membership", "roles"] : []),
    ...(canManagePerms ? ["permissions"] : [])
  ];

  // If user has no access to any tabs, show message
  if (availableTabs.length === 0) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don&apos;t have permission to access organization settings. Contact your organization administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto space-y-5">
      <Tabs defaultValue={availableTabs[0]} className="w-full">
        <TabsList className="flex gap-1 justify-start">
          <Each
            of={availableTabs}
            render={(value) => {
              const name = value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
              return (
                <TabsTrigger key={value} value={value}>{name}</TabsTrigger>
              )
            }}
          />
        </TabsList>
        {isMember && (
          <TabsContent value="general">
            <OrgGeneralSettings canUpdate={canUpdateInfo} />
          </TabsContent>
        )}
        {canManageMembers && (
          <>
            <TabsContent value="membership">
              <OrgMembershipSettings/>
            </TabsContent>
            <TabsContent value="roles">
              <OrganizationRolesSetting/>
            </TabsContent>
          </>
        )}
        {canManagePerms && (
          <TabsContent value="permissions">
            <OrgPermissionsSetting/>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
