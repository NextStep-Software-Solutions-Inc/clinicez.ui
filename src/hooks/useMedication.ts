import { GetMedicationDrugs } from "@actions/medications/medication-drug.action";
import { GetMedication, GetMedications, GetMedicationsFilters } from "@actions/medications/medication.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useMedications = (filters?: GetMedicationsFilters) => {

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const fetcher = (args:string) => self.get<GetMedications>(args)
  return useSWR(`/api/medications?${searchParams.toString()}`, fetcher)
}


export const useMedication = (medicationId: number) => {
  const fetcher = (args:string) => self.get<GetMedication>(args)
  return useSWR(`/api/medications/${medicationId}`, fetcher)
}

export const useMedicationDrugs = (medicationId: number) => {
  const fetcher = (args:string) => self.get<GetMedicationDrugs>(args)
  return useSWR(`/api/medications/${medicationId}/medication-drugs`, fetcher)

}