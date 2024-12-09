import { GetClinicMembers, GetClinicMembersFilters } from "@/actions/clinics/clinic-member.action"
import { self } from "@services/request"
import useSWR from "swr"


export const useClinicMembers = (filters: GetClinicMembersFilters) => {
  const fetcher = (args:string) => self.get<GetClinicMembers>(args)
  const searchParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if(value !== undefined || value !== null) searchParams.set(key, value.toString())
  })
  
  return useSWR(`/api/clinics/${filters.clinicUid}/clinic-members?${searchParams.toString()}`, fetcher)
}
