import { GetClinicConsultationConfig } from "@actions/consultation/consultation-config.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicConsultationConfig = (clinicUid: string) => {
  const fetcher = (args:string) => self.get<GetClinicConsultationConfig>(args)
  return useSWR(`/api/clinics/${clinicUid}/clinic-setting/consultation-config`, fetcher)

}
