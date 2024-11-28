"use client";

import { GetUserDefaultOrg, getUserDefaultOrgsRole } from "@/actions/users/user-default.action";
import { self } from "@/services/request";
import useSWR from "swr";

export const useUserDefaultOrgsRole = (userId: string, enable = true) => {

  const fetcher = (args: string) => self.get<getUserDefaultOrgsRole>(args);
  return useSWR(enable ? `/api/users/${userId}/default/org-role` : null, fetcher);

}

export const useUserDefaultOrg = (userId: string, enable = true) => {

  const fetcher = (args: string) => self.get<GetUserDefaultOrg>(args);
  return useSWR(enable ? `/api/users/${userId}/default/org`: null, fetcher);
}