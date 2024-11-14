"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useParams } from "next/navigation";
import PageLoading from "@components/PageLoading";
import { ClinicRoleCard } from "./ClinicRoleCard";
import AddClinicRoleModal from "./modal/AddClinicRoleModal";
import { useClinicRoles } from "@/hooks/useClinicRole";


export default function ClinicRolesSetting(){
  const {clinicUid} = useParams<{clinicUid: string}>();
  const {data: clinicRoles, isLoading: loadingOrgRoles, mutate} = useClinicRoles({clinicUid});
  
  if(loadingOrgRoles) return <PageLoading label="Loading page, please wait a moment..."/>
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="flex-1">Organization Roles</span>
            <AddClinicRoleModal clinicUid={clinicUid} onAddRole={mutate}/>
          </div>
        </CardTitle>
        <CardDescription>
          Manage roles for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Each
          of={clinicRoles ?? []}
          render={(role) => {
            return (
              <ClinicRoleCard key={role.id} role={role} onDeleteRole={mutate}/>
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}




