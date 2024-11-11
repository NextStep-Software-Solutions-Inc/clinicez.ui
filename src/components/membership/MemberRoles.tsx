"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useOrgRoles } from "@hooks/useOrgRole";

interface MemberRolesProps {
    userId: string;
    orgUid: string;
}
export default function MemberRoles({orgUid,userId}:MemberRolesProps){

  const {data: roles, isLoading: loadingRoles} = useOrgRoles(orgUid,  {userId});

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
          of={roles ?? []}
          render={(role) => {
            return (
              <div key={role.id} className="flex items-center gap-2">
                <div>{role.name}</div>
                <div className="text-xs text-muted-foreground">{role.description}</div>
              </div>
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
