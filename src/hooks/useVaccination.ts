import { GetUserVaccinations } from "@actions/users/user-vaccination.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useVaccinations= (userId: string) => {
  const fetcher = (args: string) => self.get<GetUserVaccinations>(args)
  const searchParams = new URLSearchParams({ userId })
  return useSWR(`/api/vaccinations?${searchParams.toString()}`, fetcher)
}