import { GetUserVaccinations } from "@actions/user-vaccination.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useVaccination = (userId: string) => {
  const fetcher = (...args: any) => self.get<GetUserVaccinations>(args)

  return useSWR(`/api/vaccinations?userId=${userId}`, fetcher)
}