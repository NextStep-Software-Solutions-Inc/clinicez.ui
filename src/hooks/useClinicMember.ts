import { GetClinicMembers } from "@/actions/clinics/clinic-member.action"
import { self } from "@services/request"
import useSWR from "swr"


export const useClinicMembers = (clinicUid: string) => {
  const fetcher = (args:string) => self.get<GetClinicMembers>(args)
  const searchParams = new URLSearchParams()
  
  return useSWR(`/api/clinics/${clinicUid}/clinic-members?${searchParams.toString()}`, fetcher)
}
