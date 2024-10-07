"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import UnderConstruction from "@components/UnderConstruction";

export const OrgMembershipSettings = () => {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership</CardTitle>
        <CardDescription>
          Manage membership for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UnderConstruction/>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}