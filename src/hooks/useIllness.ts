import { GetUserIllnesses } from "@actions/users/user-illness.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useIllnesses = (userId: string) => {
  const fetcher = (args: string) => self.get<GetUserIllnesses>(args)
  const searchParams = new URLSearchParams({userId})
  return useSWR(`/api/illnesses?${searchParams.toString()}`,fetcher)
}