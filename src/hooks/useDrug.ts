import { GetDrugs } from "@actions/medications/drug.action";
import { GetMedicationsFilters } from "@actions/medications/medication.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useDrugs = (filters?: GetMedicationsFilters) => {

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const fetcher = (args:string) => self.get<GetDrugs>(args)
  return useSWR(`/api/drugs?${searchParams.toString()}`, fetcher)
}

