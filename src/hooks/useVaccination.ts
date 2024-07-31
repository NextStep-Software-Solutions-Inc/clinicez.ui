import { GetUserVaccinations } from "@actions/users/user-vaccination.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useVaccinations= (userId: string) => {
  const fetcher = (...args: any) => self.get<GetUserVaccinations>(args)

  return useSWR(`/api/vaccinations?userId=${userId}`, fetcher)
}