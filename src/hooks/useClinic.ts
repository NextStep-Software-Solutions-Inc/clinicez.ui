import { GetClinic, GetClinics, GetClinicsFilters } from "@/actions/clinics/clinic.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinics = (filters: GetClinicsFilters) => {
  const fetcher = (args:string) => self.get<GetClinics>(args)
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if(value !== null || value !== undefined) searchParams.append(key, value.toString())
  })
  return useSWR(`/api/clinics?${searchParams.toString()}`, fetcher)
}

export const useClinic = (key: number | string) => {
  
  const fetcher = (args:string) => self.get<GetClinic>(args)
  return useSWR(`/api/clinics/${key}`, fetcher)
}