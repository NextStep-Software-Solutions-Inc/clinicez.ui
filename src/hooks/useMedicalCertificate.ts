import { GetMedicalCertificateFilters } from "@/actions/clinics/clinical-record/medical-certificate.action";
import { GetPrescriptions } from "@actions/medications/prescription.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useMedicalCertificates = (filters?: GetMedicalCertificateFilters) => {

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.set(key, value.toString())
  })

  const fetcher = (args: string) => self.get<GetPrescriptions>(args)
  return useSWR(`/api/medical-certificates?${searchParams.toString()}`, fetcher)
}