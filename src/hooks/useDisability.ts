import { GetUserDisabilities } from "@actions/users/user-disability.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useDisabilities = (userId: string) => {
  const fetcher = (args: string) => self.get<GetUserDisabilities>(args)
  return useSWR(`/api/disabilities?userId=${userId}`,fetcher)
}