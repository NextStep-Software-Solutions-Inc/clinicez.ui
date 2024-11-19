import { GetClinicServiceCategories } from "@/actions/clinics/clinic-service-category.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicServiceCategories = (clinicUid?: string) => {
  const fetcher = (args: string) => self.get<GetClinicServiceCategories>(args)
  const searchParams = new URLSearchParams()
  if(clinicUid) searchParams.set('clinicUid', clinicUid)
  return useSWR(`/api/service-categories?${searchParams.toString()}`, fetcher)
}
