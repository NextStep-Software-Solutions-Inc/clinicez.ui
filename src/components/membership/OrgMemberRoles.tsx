"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useOrgMembers } from "@/hooks/useOrgMember";

interface OrgMemberRolesProps {
  userId: string;
  orgUid: string;
}
export default function OrgMemberRoles({orgUid,userId}:OrgMemberRolesProps){

  const {data: userMemberships, isLoading: loadingRoles} = useOrgMembers({userId, orgUid});

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
          of={userMemberships?.data?.data ?? []}
          render={(role) => {
            return (
              <div key={role.id} className="flex items-center gap-2">
                <div>{role.OrganizationRole.name}</div>
                <div className="text-xs text-muted-foreground">{role.OrganizationRole.description} <span className="lowercase italic text-muted-foreground">({role.status})</span></div>
              </div>
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
