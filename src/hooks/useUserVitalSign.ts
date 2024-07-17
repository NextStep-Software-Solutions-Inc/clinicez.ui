import { GetUserVitalSignsType } from "@actions/vitals.action";
import { self } from "@services/request";
import useSWR from "swr"

export const useUserVitalSign = (userId: string) => {
  const fetcher =  (...args:any) => self.get<GetUserVitalSignsType>(args);
  return useSWR(`/api/vitals?userId=${userId}`, fetcher)
}