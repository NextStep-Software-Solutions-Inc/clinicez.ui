import { GetPrescriptions, GetPrescriptionsFilter } from "@actions/medications/prescription.action"
import { self } from "@services/request"
import useSWR from "swr"

export const usePrescriptions = (filters?: GetPrescriptionsFilter) => {

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const fetcher = (args:string) => self.get<GetPrescriptions>(args)
  return useSWR(`/api/prescriptions?${searchParams.toString()}`, fetcher)
}
``