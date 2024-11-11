import { GetDailyOrgMembershipRequest } from "@actions/dashboard/analytics.action"
import { self } from "@services/request"
import dayjs from "@lib/day-utils"
import useSWR from "swr"

type UseDailyOrgMembership = {
  startDate: string
  endDate: string
}
export const useDailyOrgMemberships = (orfUid: string, {startDate, endDate}:UseDailyOrgMembership) => {
  const fetcher = (args:string) => self.get<GetDailyOrgMembershipRequest>(args)
  const searParams = new URLSearchParams()
  searParams.set('orgId', orfUid)
  searParams.set('startDate', dayjs(startDate).toISOString())
  searParams.set('endDate', dayjs(endDate).toISOString())
  return useSWR(`/api/analytics?${searParams.toString()}`, fetcher)
}