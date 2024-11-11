import { GetUserIllnesses } from "@actions/users/user-illness.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useIllnesses = (userId: string) => {
  const fetcher = (...args: any) => self.get<GetUserIllnesses>(args)
  return useSWR(`/api/illnesses?userId=${userId}`,fetcher)
}