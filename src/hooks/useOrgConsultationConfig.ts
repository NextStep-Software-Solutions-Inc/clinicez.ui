import { GetOrgConsultationConfig } from "@actions/consultation/consultation-config.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgConsultationConfig = (orgUid: string) => {
  const fetcher = (args:any) => self.get<GetOrgConsultationConfig>(args)
  return useSWR(`/api/organizations/${orgUid}/org-setting/consultation-config`, fetcher)

}
