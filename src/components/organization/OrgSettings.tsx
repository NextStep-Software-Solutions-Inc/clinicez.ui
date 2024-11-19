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

const tabs = ["general", "membership", "roles", "permissions"]
export default function OrgSettings() {
  return (

    <div className="container mx-auto space-y-5">
      {/* <h5 className="text-lg font-bold">Organization Membership Requirements</h5> */}
      <Tabs defaultValue={tabs[0]} className="w-full">
        <TabsList className="flex gap-1 justify-start">
          <Each
            of={tabs}
            render={(value) => {
              const name = value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
              return (
                (
                  <TabsTrigger key={value} value={value}>{name}</TabsTrigger>
                )
              )
            }}
          />
        </TabsList>
        <TabsContent value="general">
          <OrgGeneralSettings/>
        </TabsContent>
        <TabsContent value="membership">
          <OrgMembershipSettings/>
        </TabsContent>
        <TabsContent value="roles">
          <OrganizationRolesSetting/>
        </TabsContent>
        <TabsContent value="permissions">
          <OrgPermissionsSetting/>
        </TabsContent>
      </Tabs>
    </div>

  );
}
