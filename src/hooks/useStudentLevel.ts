import { GetStudentLevels } from "@actions/student-level.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useStudentLevels = () => {
  const fetcher = (args: string) => self.get<GetStudentLevels>(args)
  return useSWR(`/api/student-levels`, fetcher)
}