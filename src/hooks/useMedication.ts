import { GetMedicationDrugs } from "@actions/medications/medication-drug.action";
import { GetMedication, GetMedications, GetMedicationsFilters } from "@actions/medications/medication.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useMedications = (filters?: GetMedicationsFilters) => {

  const searchParams = new URLSearchParams();
  const {clinicId} = filters ?? {}
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const fetcher = (args:string) => self.get<GetMedications>(args)
  return useSWR(!!clinicId ?`/api/medications?${searchParams.toString()}`: null, fetcher)
}


export const useMedication = (medicationId: number, clinicId: number) => {

  const searchParams = new URLSearchParams();
  searchParams.set("clinicId", clinicId.toString())
  const fetcher = (args:string) => self.get<GetMedication>(args)
  return useSWR(!!medicationId ? `/api/medications/${medicationId}?${searchParams.toString()}`: null, fetcher)
}

export const useMedicationDrugs = (medicationId: number) => {
  const fetcher = (args:string) => self.get<GetMedicationDrugs>(args)
  return useSWR(!!medicationId ?`/api/medications/${medicationId}/medication-drugs`:null, fetcher)

}