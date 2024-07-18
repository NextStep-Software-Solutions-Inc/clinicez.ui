import { GetDailyOrgMembershipRequest } from "@actions/dashboard/analytics.action"
import { self } from "@services/request"
import dayjs from "dayjs"
import useSWR from "swr"

type UseDailyOrgMembership = {
  startDate: string
  endDate: string
}
export const useDailyOrgMembership = (userId: string, {startDate, endDate}:UseDailyOrgMembership) => {
  const fetcher = (...args:any) => self.get<GetDailyOrgMembershipRequest>(args)
  const searParams = new URLSearchParams()
  searParams.set('orgId', userId)
  searParams.set('startDate', dayjs(startDate).format('YYYY-MM-DD'))
  searParams.set('endDate', dayjs(endDate).format('YYYY-MM-DD'))
  return useSWR(`/api/analytics?${searParams.toString()}`, fetcher)
}