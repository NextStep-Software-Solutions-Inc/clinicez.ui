"use client";

import  useSWR from "swr";
import { self } from "@services/request"
import { GetOrgUserEmploymentRecord } from "@/actions/employee-record.action";

export const useOrgEmployeeRecord  = ({userId, orgUid}: {userId: string, orgUid: string}) => {
  const fetcher = (args: string) => self.get<GetOrgUserEmploymentRecord>(args)
  return useSWR(`/api/organizations/${orgUid}/employee-record/${userId}`, fetcher)
}