"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { useOrganizationRoles } from "@/hooks/useOrganizationRole";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import EmployeeRecordForm from "../../app/(activation)/organizations/[orgUid]/join/EmployeeRecordForm";
import StudentRecordForm from "../../app/(activation)/organizations/[orgUid]/join/StudentRecordForm";
import OrgMemberRoles from "./OrgMemberRoles";
import MemberActivities from "./MemberActivities";
import OrgMemberPermissions from "./OrgMemberPermissions";
import { useOrgMembers } from "@/hooks/useOrgMember";


interface OrgMemberTabSectionProps {
    userId: string;
    orgUid: string;
}
export default function OrgMemberTabSection({orgUid, userId}:OrgMemberTabSectionProps) {
  
  const params = useParams<{orgUid: string}>();
  const {data: myOrgRoles} = useOrgMembers({
    orgUid: params.orgUid,
    userId: userId
  })

  const orgRequirements = useMemo(() => [...new Set(myOrgRoles?.data?.data?.flatMap((role) => role.OrganizationRole.requirements))], [myOrgRoles]);
  
  return (
    <Tabs defaultValue="roles" className="w-full">
      <TabsList className="flex gap-1 justify-start">
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <Each
          of={orgRequirements}
          fallback={""}
          render={(value) => {
            const name = value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
            return (
              <TabsTrigger key={value} value={value}>{name}</TabsTrigger>
            )
          }}
        />
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
                          orgUid={String(params?.orgUid)}
                          userId={userId}
                        />
                      </ConditionalRender>
                      <ConditionalRender condition={value === "student_record"}>
                        <StudentRecordForm 
                          orgUid={String(params?.orgUid)}
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
        <OrgMemberRoles userId={userId} orgUid={orgUid}/>
      </TabsContent>
      <TabsContent value="permissions">
        <OrgMemberPermissions userId={userId} orgUid={orgUid} />
      </TabsContent>
      <TabsContent value="activities">
        <MemberActivities/>
      </TabsContent>
    </Tabs>
  )
}
