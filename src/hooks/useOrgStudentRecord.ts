"use client";

import  useSWR from "swr";
import { self } from "@services/request"
import { GetOrgStudentRecord } from "@/actions/student-record.action";

export const useOrgStudentRecord = ({userId, orgUid}: {userId: string, orgUid: string}) => {
  const fetcher = (args: string) => self.get<GetOrgStudentRecord>(args)
  return useSWR(`/api/organizations/${orgUid}/student-record/${userId}`, fetcher)
}