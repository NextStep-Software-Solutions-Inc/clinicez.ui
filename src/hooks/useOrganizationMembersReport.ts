import { GetOrganizationMembersReport } from "@actions/organizations/org-report.action";
import { self } from "@services/request";
import useSWR from "swr";

export const useOrganizationMembersReport = (orgUid: string) => {
  const fetcher = (url: string) => self.get<GetOrganizationMembersReport>(url);
  return useSWR(() => (orgUid ? `/api/organizations/${orgUid}/reports/members` : null), fetcher);
};
