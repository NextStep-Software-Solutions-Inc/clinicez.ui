import { GetDocumentTemplates, GetDocumentTemplatesFilters } from "@/actions/document-template.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useDocumentTemplates = (filters?: GetDocumentTemplatesFilters) => {

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const fetcher = (args:string) => self.get<GetDocumentTemplates>(args)
  return useSWR(`/api/document-templates?${searchParams.toString()}`, fetcher)
}
``