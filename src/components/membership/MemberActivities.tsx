"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import UnderConstruction from "@components/UnderConstruction";

export default function MemberActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
              Activities
        </CardTitle>
        <CardDescription>
              Activities performed by this member in the organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UnderConstruction/>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}