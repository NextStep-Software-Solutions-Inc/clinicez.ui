"use client";

import { GetMyTenants, GetTenants } from "@actions/tenant.action";
import { LabelValue } from "@components/LabelValue";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import dayjs from "dayjs";
import React from "react";

interface TenantCardProps {
    details: GetMyTenants["data"][number]
}

export default function TenantCard({details}: TenantCardProps) {
  return (
    <Card 
      className="ring-4 ring-primary"
    >
      <CardHeader>
        <CardTitle>{details.name}</CardTitle>
        <CardDescription className="truncate">Created {dayjs(details.createdAt).format('lll')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-5">
          <LabelValue label="Clinics" value="0" />
          <LabelValue label="Organizations" value={details._count.Organizations} />
        </div>
      </CardContent>
    </Card>
  );
}
