"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import Each from "@components/utils/Each";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import ConditionalRender from "@components/utils/ConditionalRender";
import EmployeeRecordForm from "../../app/(activation)/[organization]/join/EmployeeRecordForm";
import StudentRecordForm from "../../app/(activation)/[organization]/join/StudentRecordForm";
import { useParams } from "next/navigation";

const orgRequirements = ["student_record", "employee_record"]
export default function MyOrgProfile() {
  const params = useParams<{organization: string}>();
  return (
    <div className="container mx-auto space-y-5">
      <h5 className="text-lg font-bold">Organization Membership Requirements</h5>
      <Tabs defaultValue={orgRequirements[0]} className="w-full">
        <TabsList className="flex gap-1 justify-start">
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
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <>
                        <ConditionalRender condition={value === "employee_record"}>
                          <EmployeeRecordForm orgId={params.organization}/>
                        </ConditionalRender>
                        <ConditionalRender condition={value === "student_record"}>
                          <StudentRecordForm orgId={params.organization}/>
                        </ConditionalRender>
                      </>
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            )
          }}
        />
      </Tabs>
    </div>
  );
}
