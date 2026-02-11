"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import Each from "@components/utils/Each";
import ClinicGeneralSettings from "../dashboard/clinic-settings/ClinicGeneralSettings";
import ClinicRolesSetting from "../dashboard/clinic-settings/ClinicRolesSetting";
import ClinicPermissionsSetting from "../dashboard/clinic-settings/ClinicPermissionsSetting";
import ClinicMembershipSettings from "../dashboard/clinic-settings/ClinicMembershipSettings";
import AppointmentSettings from "../dashboard/clinic-settings/AppointmentSettings";
import ConsultationSettings from "../dashboard/clinic-settings/ConsultationSettings";
import SystemList from "../dashboard/org-settings/SystemList";
import ClinicPrescriptionSetting from "../dashboard/clinic-settings/ClinicPrescriptionSetting";
import PhilHealthSettings from "../dashboard/clinic-settings/PhilHealthSettings";
import ActionList from "../dashboard/org-settings/ActionList";

const tabs = ["general", "membership", "roles", "appointment", "consultation", "prescription", "philhealth", "permissions"]
export default function ClinicSettings() {
  return (

    <div className="container mx-auto space-y-5">


      {/* <h5 className="text-lg font-bold">Organization Membership Requirements</h5> */}
      <Tabs defaultValue={tabs[0]} className="w-full">
        <TabsList className="">
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
          <ClinicGeneralSettings />
        </TabsContent>
        <TabsContent value="membership">
          <ClinicMembershipSettings />
        </TabsContent>
        <TabsContent value="appointment">
          <div className="space-y-2">
            <AppointmentSettings />
          </div>
        </TabsContent>
        <TabsContent value="consultation">
          <div className="space-y-2">
            <ConsultationSettings />
            <SystemList />
            {/* <ActionList/> */}
          </div>
        </TabsContent>
        <TabsContent value="roles">
          <ClinicRolesSetting />
        </TabsContent>
        <TabsContent value="prescription">
          <ClinicPrescriptionSetting />
        </TabsContent>
        <TabsContent value="philhealth">
          <PhilHealthSettings />
        </TabsContent>
        <TabsContent value="permissions">
          <ClinicPermissionsSetting />
        </TabsContent>
      </Tabs>
    </div>

  );
}
