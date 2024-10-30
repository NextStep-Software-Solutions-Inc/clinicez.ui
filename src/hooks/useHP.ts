import { GetHP, GetHpsByIds, GetHPsType, HPSFilters } from "@actions/hp.actions";
import { self } from "@services/request";
import useSWR from "swr";

export const useHPs = (filters?: HPSFilters, enable = true) => {
  const fetcher = (args: string) => self.get<GetHPsType>(args)


  const searchParams = new URLSearchParams()
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.append(key, value.toString())
  })

  return useSWR(() => enable ? `/api/hps?${searchParams.toString()}` : null, fetcher)
}

export const useHP = (id: number) => {
  const fetcher = (args: string) => self.get<GetHP>(args)
  return useSWR(() => !!id ? `/api/hps/${id}` : null, fetcher)
}

export const useHPsByIds = (ids: number[]) => {
  const fetcher = (args: string) => self.post<GetHpsByIds>(args, {
    body: JSON.stringify({ids})
  })
  return useSWR(() => !!ids.length ? `/api/hps` : null, fetcher)
}