import { GetOrgSetting } from "@actions/organizations/org-setting.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgSetting = (orgUid: string) => {
  const fetcher = (args:any) => self.get<GetOrgSetting>(args)
  return useSWR(`/api/organizations/${orgUid}/org-setting`, fetcher)

}
