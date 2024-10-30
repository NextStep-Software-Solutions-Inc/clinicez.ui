import { GetHPTypes } from "@actions/hp-type.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useHPTypes = () => {
  const fetcher = (args:string) => self.get<GetHPTypes>(args)
  return useSWR(`/api/hp-types`, fetcher)
}
