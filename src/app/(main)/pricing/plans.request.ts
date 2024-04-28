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
  const response = await request.get('/api/plan-package/tenant')
  
  if(!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error, null, 2))
  }
  return await response.json() as ResponseType
}

