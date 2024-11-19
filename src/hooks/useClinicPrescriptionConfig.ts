import { GetClinicPrescriptionConfig } from "@/actions/medications/prescription-config.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicPrescriptionConfig = (clinicUid: string) => {
  const fetcher = (args:string) => self.get<GetClinicPrescriptionConfig>(args)
  return useSWR(`/api/clinics/${clinicUid}/clinic-setting/prescription-config`, fetcher)

}
