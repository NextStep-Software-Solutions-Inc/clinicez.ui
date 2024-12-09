"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useClinicMembers } from "@/hooks/useClinicMember";

interface ClinicMemberRolesProps {
  userId: string;
  clinicUid: string;
}
export default function ClinicMemberRoles({clinicUid,userId}:ClinicMemberRolesProps){

  const {data: roles, isLoading: loadingRoles} = useClinicMembers({userId, clinicUid});

  if(loadingRoles) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>
            Roles assigned to this member.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Each
          of={roles?.data ?? []}
          render={(role) => {
            return (
              <div key={role.id} className="flex items-center gap-2">
                <div>{role.Role?.name}</div>
                <div className="text-xs text-muted-foreground">{"N/A"}</div>
                <span className="text-xs italic lowercase">({role.status})</span>
              </div>
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
