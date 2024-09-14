import { GetDailyOrgMembershipRequest } from "@actions/dashboard/analytics.action"
import { self } from "@services/request"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)
import useSWR from "swr"

type UseDailyOrgMembership = {
  startDate: string
  endDate: string
}
export const useDailyOrgMemberships = (userId: string, {startDate, endDate}:UseDailyOrgMembership) => {
  const fetcher = (...args:any) => self.get<GetDailyOrgMembershipRequest>(args)
  const searParams = new URLSearchParams()
  searParams.set('orgId', userId)
  searParams.set('startDate', dayjs(startDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ'))
  searParams.set('endDate', dayjs(endDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ'))
  return useSWR(`/api/analytics?${searParams.toString()}`, fetcher)
}