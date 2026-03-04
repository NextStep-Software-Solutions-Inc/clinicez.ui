import { GetUserVitalSigns } from "@actions/vitals.action";
import { self } from "@services/request";
import useSWR from "swr"

export const useUserVitalSigns = (userId: string) => {
  const fetcher =  (args:string) => self.get<GetUserVitalSigns>(args);
  return useSWR(userId ? `/api/vitals?userId=${userId}` : null, fetcher)
}