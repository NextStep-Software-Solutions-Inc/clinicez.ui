import { GetClinicSetting } from "@actions/organizations/clinic-setting.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicSetting = (clinicUid: string) => {
  const fetcher = (args:string) => self.get<GetClinicSetting>(args)
  return useSWR(`/api/clinics/${clinicUid}/org-setting`, fetcher)

}
