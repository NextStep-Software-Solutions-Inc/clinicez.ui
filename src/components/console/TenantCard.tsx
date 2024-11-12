"use client";

import { GetMyTenants } from "@actions/tenant.action";
import { LabelValue } from "@components/LabelValue";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import dayjs from "dayjs";
import Link from "next/link";
import React from "react";

interface TenantCardProps {
    details: GetMyTenants["data"][number]
}

export default function TenantCard({details}: TenantCardProps) {
  return (
    <Link
      href={`tenants/${details.tenantUid}/dashboard`}
    >
      <Card 
        className="cursor-pointer opacity-90 hover:opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out"
      >
        <CardHeader>
          <CardTitle className="truncate">
            <Tooltip>
              <TooltipTrigger>{details.name}</TooltipTrigger>
              <TooltipContent>
                {details.name}
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription className="truncate">
            <Tooltip>
              <TooltipTrigger>
              Created {dayjs(details.createdAt).format('lll')}</TooltipTrigger>
              <TooltipContent>
              Created {dayjs(details.createdAt).format('lll')}
              </TooltipContent>
            </Tooltip>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-5">
            <LabelValue label="Clinics" value="0" />
            <LabelValue label="Organizations" value={details._count.Organizations} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
