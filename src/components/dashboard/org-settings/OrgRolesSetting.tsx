"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useOrganizationRoles } from "@/hooks/useOrganizationRole";
import { useParams } from "next/navigation";
import PageLoading from "@components/PageLoading";
import { OrgRoleCard } from "./OrgRoleCard";
import AddRoleModal from "./modal/AddRoleModal";


export default function OrganizationRolesSetting(){
  const {orgUid} = useParams<{orgUid: string}>();
  const {data: orgRoles, isLoading: loadingOrgRoles, mutate} = useOrganizationRoles({orgUid});
  
  if(loadingOrgRoles) return <PageLoading label="Loading page, please wait a moment..."/>
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="flex-1">Organization Roles</span>
            <AddRoleModal orgUid={orgUid} onAddRole={mutate}/>
          </div>
        </CardTitle>
        <CardDescription>
          Manage roles for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Each
          of={orgRoles ?? []}
          render={(role) => {
            return (
              <OrgRoleCard key={role.id} role={role} onDeleteRole={mutate}/>
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}




