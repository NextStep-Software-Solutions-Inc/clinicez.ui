import { GetClinic, GetClinics } from "@/actions/clinics/clinic.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinics = (userId?: string | null) => {
  const fetcher = (args:string) => self.get<GetClinics>(args)
  const searchParams = new URLSearchParams()
  if(userId) searchParams.append("userId", userId) 
  return useSWR(`/api/clinics?${searchParams.toString()}`, fetcher)
}

export const useClinic = (key: number | string) => {
  const fetcher = (args:string) => self.get<GetClinic>(args)
  return useSWR(`/api/clinics/${key}`, fetcher)
}