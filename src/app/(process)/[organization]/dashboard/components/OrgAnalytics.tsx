"use client";

import { DailyMembershipRequestChart } from "@components/charts/DailyMembershipRequestChart";
import { useDailyOrgMembership } from "@hooks/useDailyOrgMembership";
import dayjs from "dayjs";
import React, {  useMemo } from "react";
import { DateRange } from "react-day-picker";
  
export default function OrgAnalytics({ orgId }: { orgId: string; }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: dayjs().startOf("month").toDate(),
    to: dayjs().toDate(),
  })
  const {data} = useDailyOrgMembership(orgId, dayjs(date?.from).startOf("month").format("YYYY-MM-DD"), dayjs(date?.to).format("YYYY-MM-DD"));

  const chartData = useMemo(() => (data ?? []).map((item) => ({
    date: dayjs(item.date).format("YYYY-MM-DD"),
    request: Number(item.total_requests),
  })), [data]);

  return (
    <div className="grid gap-2 grid-cols-1">
      <DailyMembershipRequestChart chartData={chartData} onChangeDate={setDate} dateRange={date} />
    </div>
  )
}
