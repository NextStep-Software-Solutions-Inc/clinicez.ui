import useSWR from "swr";
import { self } from "@/services/request";
import type { GetPrescriptions, GetPrescriptionFilters } from "@/actions/clinics/clinical-record/prescription.action";

export function usePrescriptions(filters: GetPrescriptionFilters) {
  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.set(key, JSON.stringify(value));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  })

  const fetcher = async (url: string): Promise<GetPrescriptions> => {
    return self.get<GetPrescriptions>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<GetPrescriptions>(
    `/api/prescriptions?${searchParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    prescriptions: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePrescription(prescriptionId: number | null) {
  const fetcher = async (url: string): Promise<any> => {
    return self.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    prescriptionId ? `/api/prescriptions/${prescriptionId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    prescription: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
