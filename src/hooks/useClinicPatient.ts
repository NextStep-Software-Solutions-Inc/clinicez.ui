import { GetClinicPatientFilters, GetClinicPatients } from "@/actions/clinics/clinic-patient.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicPatients = (filters: GetClinicPatientFilters) => {
  const fetcher = (args:string) => self.get<GetClinicPatients>(args)
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if(value)   searchParams.set(key, value.toString())
  })

  return useSWR(`/api/clinics/${filters.clinicUid}/patients?${searchParams.toString()}`, fetcher)
}

