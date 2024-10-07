"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import UnderConstruction from "@components/UnderConstruction";

export const OrgPermissionsSetting = () => {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          Configure permissions requirements for every feature in your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UnderConstruction/>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}