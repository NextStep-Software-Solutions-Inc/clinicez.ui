import { GetHpsByIds, GetHPsType, HPFilters } from "@actions/hp.actions";
import { self } from "@services/request";
import useSWR from "swr";

export const useHPs = (filters?: HPFilters, enable = true) => {
  const fetcher = (...args: any) => self.get<GetHPsType>(args)

  const obj = {
    ...filters?.userId ? { userId: filters.userId } : {},
    ...filters?.type ? { type: filters.type } : {},
    ...filters?.isPublished ? { isPublished: filters.isPublished.toString() } : {},
  }
  const query = new URLSearchParams(obj).toString()
    
  return useSWR(() => enable ? `/api/hps?${query}` : null, fetcher)
}

export const useHPsByIds = (ids: number[]) => {
  const fetcher = (args: string) => self.post<GetHpsByIds>(args, {
    body: JSON.stringify({ids})
  })
  return useSWR(() => !!ids.length ? `/api/hps` : null, fetcher)
}