"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import Each from "@components/utils/Each";
import GeneralSettings from "./org-settings/GeneralSettings";
import ConsultationSettings from "./org-settings/ConsultationSettings";
import OrganizationRolesSetting from "./org-settings/OrgRolesSetting";
import OrgPermissionsSetting from "./org-settings/OrgPermissionsSetting";
import OrgMembershipSettings from "./org-settings/OrgMembershipSettings";
import AppointmentSettings from "./org-settings/AppointmentSettings";
import AppointmentTabsConfig from "./org-settings/AppointmentTabsConfig";
import AppointmentTypeList from "./org-settings/AppointmentTypeList";
import AppointmentModeList from "./org-settings/AppointmentModeList";
import ServiceCategoryList from "./org-settings/ServiceCategoryList";
import SystemList from "./org-settings/SystemList";
import ActionList from "./org-settings/ActionList";

const tabs = ["general", "membership", "appointments", "consultations", "roles", "permissions"]
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
          <GeneralSettings/>
        </TabsContent>
        <TabsContent value="membership">
          <OrgMembershipSettings/>
        </TabsContent>
        <TabsContent value="appointments" asChild>
          <div className="space-y-5">
            <AppointmentSettings/>
            <AppointmentTabsConfig/>
            <AppointmentTypeList/>
            <AppointmentModeList/>
            <ServiceCategoryList/>
           
          </div>
        </TabsContent>
        <TabsContent value="consultations">
          <div className="space-y-5">
            <ConsultationSettings/>
            <SystemList/>
            <ActionList/>
          </div>
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
