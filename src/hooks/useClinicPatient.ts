import { GetClinicPatients } from "@/actions/clinics/clinic-patient.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicPatients = ({clinicUid}: {clinicUid: string}) => {
  const fetcher = (args:string) => self.get<GetClinicPatients>(args)
  const searchParams = new URLSearchParams()
  return useSWR(`/api/clinics/${clinicUid}/patients?${searchParams.toString()}`, fetcher)
}

