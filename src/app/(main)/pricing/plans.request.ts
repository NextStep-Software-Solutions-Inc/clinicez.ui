import { request } from "@services/request"

type ResponseType = {
    response: PlanType
}

export type PlanType = {
    [key:string]: {
      id: number,
      name: string,
      price: string,
      features: string[],
    }[]
}

export const getTenantPlanPackage = async ()  => {
  const tenantPlans = await request.get('/api/plan-package/tenant', {
    cache: "no-cache"
  })
  return await tenantPlans.json() as ResponseType
}

