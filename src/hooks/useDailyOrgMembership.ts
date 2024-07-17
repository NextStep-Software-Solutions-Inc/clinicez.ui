import { GetDailyOrgMembershipRequest } from "@actions/dashboard/analytics.action"
import { self } from "@services/request"
import dayjs from "dayjs"
import useSWR from "swr"

export const useDailyOrgMembership = (userId: string, startDate: string, endDate:string) => {
  const fetcher = (...args:any) => self.get<GetDailyOrgMembershipRequest>(args)
  const searParams = new URLSearchParams()
  searParams.set('orgId', userId)
  searParams.set('startDate', dayjs(startDate).format('YYYY-MM-DD'))
  searParams.set('endDate', dayjs(endDate).format('YYYY-MM-DD'))
  return useSWR(`/api/analytics?${searParams.toString()}`, fetcher)
}