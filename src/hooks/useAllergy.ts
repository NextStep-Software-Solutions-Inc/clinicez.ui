import { GetUserAllergies } from "@actions/users/user-allergy.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useAllergies = (userId: string) => {
  const fetcher = (...args:any) => self.get<GetUserAllergies>(args)
  return useSWR(`/api/allergies?userId=${userId}`, fetcher)
}
