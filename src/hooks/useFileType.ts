import { GetFileTypes } from "@actions/file-type.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useFileTypes = () => {
  const fetcher = (args:any) => self.get<GetFileTypes>(args)
  return useSWR(`/api/file-types`, fetcher)
}