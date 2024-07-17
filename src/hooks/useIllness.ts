import { GetUserIllnesses } from "@actions/user-illness.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useIllness = (userId: string) => {
  const fetcher = (...args: any) => self.get<GetUserIllnesses>(args)
  return useSWR(`/api/illnesses?userId=${userId}`,fetcher)
}