import { GetHPsType, HPFilters } from "@actions/hp.actions";
import { self } from "@services/request";
import useSWR from "swr";

export const useHPs = (filters: HPFilters, enable = true) => {
  const fetcher = (...args: any) => self.get<GetHPsType>(args)

  const obj = {
    ...filters.userId ? { userId: filters.userId } : {},
    ...filters.isPublished ? { isPublished: filters.isPublished.toString() } : {},
  }
  const query = new URLSearchParams(obj).toString()
    
  return useSWR(() => enable ? `/api/hps?${query}` : null, fetcher)
}