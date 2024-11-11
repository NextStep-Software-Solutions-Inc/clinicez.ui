"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { useOrganizationRoles } from "@/hooks/useOrganizationRole";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import EmployeeRecordForm from "../../app/(activation)/[organization]/join/EmployeeRecordForm";
import StudentRecordForm from "../../app/(activation)/[organization]/join/StudentRecordForm";
import MemberRoles from "./MemberRoles";
import { MemberPermissions } from "./MemberPermissions";
import MemberActivities from "./MemberActivities";
import AppointmentWhitelistFilters from "./AppointmentWhitelistFilter";


interface MemberTabSectionProps {
    userId: string;
    orgUid: string;
}
export default function MemberTabSection({orgUid, userId}:MemberTabSectionProps) {
  const params = useParams<{organization: string}>();
  const {data: myOrgRoles} = useOrganizationRoles(params.organization, {
    userId: userId
  })

  const orgRequirements = useMemo(() => [...new Set(myOrgRoles?.flatMap((role) => role.requirements))], [myOrgRoles]);
  
  return (
    <Tabs defaultValue="roles" className="w-full">
      <TabsList className="flex gap-1 justify-start">
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <Each
          of={orgRequirements}
          render={(value) => {
            const name = value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
            return (
              (
                <TabsTrigger key={value} value={value}>{name}</TabsTrigger>
              )
            )
          }}
        />
        <TabsTrigger value="appointment-whitelist-filter">Appointment Whitelist Filter</TabsTrigger>
        <TabsTrigger value="activities">Activities</TabsTrigger>
      </TabsList>
      <Each
        of={orgRequirements}
        render={(value) => {
          const name = value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
          return (
            (
              <TabsContent value={value} key={value}>
                <Card className="space-y-2">
                  <CardHeader>
                    <CardTitle>{name}</CardTitle>
                    <CardDescription>
                        Newly submitted records will be reviewed by the organization admin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <>
                      <ConditionalRender condition={value === "employee_record"}>
                        <EmployeeRecordForm 
                          orgUid={params.organization}
                          userId={userId}
                        />
                      </ConditionalRender>
                      <ConditionalRender condition={value === "student_record"}>
                        <StudentRecordForm 
                          orgUid={params.organization}
                          userId={userId}
                        />
                      </ConditionalRender>
                    </>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          )
        }}
      />
      <TabsContent value="roles">
        <MemberRoles userId={userId} orgUid={orgUid}/>
      </TabsContent>
      <TabsContent value="permissions">
        <MemberPermissions userId={userId} orgUid={orgUid} />
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
