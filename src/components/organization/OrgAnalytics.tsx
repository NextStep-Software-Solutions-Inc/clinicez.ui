"use client";

import { DailyMembershipRequestChart } from "@components/charts/DailyMembershipRequestChart";
import { useDailyOrgMemberships } from "@hooks/useDailyOrgMembership";
import dayjs from "@lib/day-utils";


import {  useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
  
export default function OrgAnalytics({ orgUid }: { orgUid: string; }) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: dayjs().startOf("month").toDate(),
    to: dayjs().endOf("day").toDate(),
  })
  
  const { data } = useDailyOrgMemberships(orgUid, {
    startDate: dayjs(date?.from).startOf("day").format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
    endDate: dayjs(date?.to).endOf("day").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
  });
  
  const chartData = useMemo(() => (data ?? []).map((item) => ({
    date: dayjs(item.date).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
    male: Number(item.total_male_request),
    female: Number(item.total_female_request),
  })), [data]);

  return (
    <div className="grid gap-2 grid-cols-1">
      <DailyMembershipRequestChart chartData={chartData} onChangeDate={setDate} dateRange={date} />
    </div>
  )
}
