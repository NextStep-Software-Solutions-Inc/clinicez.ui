"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { ClinicMemberPermissions } from "./ClinicMemberPermissions";
import MemberActivities from "./MemberActivities";
import AppointmentWhitelistFilters from "./AppointmentWhitelistFilter";
import ClinicMemberRoles from "./ClinicMemberRoles";

interface ClinicMemberTabSectionProps {
    userId: string;
    clinicUid: string;
}

export default function ClinicMemberTabSection({clinicUid, userId}:ClinicMemberTabSectionProps) {

  return (
    <Tabs defaultValue="roles" className="w-full">
      <TabsList className="flex gap-1 justify-start">
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="appointment-whitelist-filter">Appointment Whitelist Filter</TabsTrigger>
        <TabsTrigger value="activities">Activities</TabsTrigger>
      </TabsList>
      <TabsContent value="roles">
        <ClinicMemberRoles userId={userId} clinicUid={clinicUid}/>
      </TabsContent>
      <TabsContent value="permissions">
        <ClinicMemberPermissions userId={userId} clinicUid={clinicUid} />
      </TabsContent>
      <TabsContent value="appointment-whitelist-filter">
        <AppointmentWhitelistFilters/>
      </TabsContent>
      <TabsContent value="activities">
        <MemberActivities/>
      </TabsContent>
    </Tabs>
  )
}
