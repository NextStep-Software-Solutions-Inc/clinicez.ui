import { GetClinicServices } from "@/actions/clinics/clinic-service.action"
import { self } from "@services/request"
import useSWR from "swr"

type UseClinicServicesFilter = {
  clinicUid: string,
  categoryId?: number
}
export const useClinicServices = (filter: UseClinicServicesFilter) => {
  const fetcher = (args:string) => self.get<GetClinicServices>(args)
  const searchParams = new URLSearchParams()

  Object.entries(filter).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })
  
  return useSWR(`/api/services?${searchParams.toString()}`, fetcher)
}
