"use server";

import { getDailyOrgMembershipRequest } from "@actions/dashboard/analytics.action";
import { DailyMembershipRequestChart } from "@components/charts/DailyMembershipRequestChart";
import dayjs from "dayjs";
import React from "react";

  
export default async function OrgAnalytics({ orgId }: { orgId: string; }) {
  const data = await getDailyOrgMembershipRequest(orgId)
  const chartData = data.map((item) => ({
    date: dayjs(item.createdAt).format("YYYY-MM-DD"),
    request: item._count._all,
  }))
    
  return (
    <div className="grid gap-2 grid-cols-1">
      <DailyMembershipRequestChart chartData={chartData} />
    </div>
  )
}
