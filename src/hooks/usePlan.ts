import { GetPlans } from "@actions/plan.action"
import { self } from "@services/request"
import useSWR from "swr"

export const usePlans = (type: "TENANT"| "HEALTHCARE_PROVIDER", frequency?: "MONTHLY"| "YEARLY") => {
  const fetcher = (args:string) => self.get<GetPlans>(args)
  const searchParams = new URLSearchParams({ type })
  if(frequency) searchParams.set("frequency", frequency)
  return useSWR(`/api/plans?${searchParams.toString()}`, fetcher)
}
