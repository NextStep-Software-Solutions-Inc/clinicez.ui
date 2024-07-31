"use client";

import { DailyMembershipRequestChart } from "@components/charts/DailyMembershipRequestChart";
import { useDailyOrgMemberships } from "@hooks/useDailyOrgMembership";
import dayjs from "dayjs";
import React, {  useMemo } from "react";
import { DateRange } from "react-day-picker";
  
export default function OrgAnalytics({ orgId }: { orgId: string; }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: dayjs().startOf("month").toDate(),
    to: dayjs().endOf("day").toDate(),
  })
  
  const {data} = useDailyOrgMemberships(orgId, {
    startDate: dayjs(date?.from).startOf("day").format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
    endDate: dayjs(date?.to).endOf("day").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
  });
  
  const chartData = useMemo(() => (data ?? []).map((item) => ({
    date: dayjs(item.date).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
    request: Number(item.total_requests),
  })), [data]);

  return (
    <div className="grid gap-2 grid-cols-1">
      <DailyMembershipRequestChart chartData={chartData} onChangeDate={setDate} dateRange={date} />
    </div>
  )
}
