import { GetDocumentTypes, GetDocumentTypesFilters } from "@/actions/document-type.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useDocumentTypes = (filters?: GetDocumentTypesFilters) => {

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const fetcher = (args:string) => self.get<GetDocumentTypes>(args)
  return useSWR(`/api/document-types?${searchParams.toString()}`, fetcher)
}
``