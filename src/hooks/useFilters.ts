import { GetFilters } from "@actions/filter.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useFilters = () => {
  const fetcher = (args:string) => self.get<GetFilters>(args)
  return useSWR(`/api/filters`, fetcher)
}
