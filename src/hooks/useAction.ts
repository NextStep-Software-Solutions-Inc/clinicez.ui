import { GetActions } from "@actions/consultation/action.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useActions = () => {
  const fetcher = (args:string) => self.get<GetActions>(args)
  return useSWR(`/api/actions`, fetcher)
}
