import { GetUserVitalSigns } from "@actions/vitals.action";
import { self } from "@services/request";
import useSWR from "swr"

export const useUserVitalSigns = (userId: string) => {
  const fetcher =  (args:string) => self.get<GetUserVitalSigns>(args);
  return useSWR(`/api/vitals?userId=${userId}`, fetcher)
}