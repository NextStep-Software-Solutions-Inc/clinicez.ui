import useSWR from "swr";
import { self } from "@/services/request";
import type { GetMedicines, GetMedicineFilters } from "@/actions/clinics/clinical-record/medicine.action";

export function useMedicines(filters: GetMedicineFilters = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(","));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  });

  const fetcher = async (url: string): Promise<GetMedicines> => {
    return self.get<GetMedicines>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<GetMedicines>(
    `/api/medicines?${searchParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    medicines: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useMedicine(medicineId: number | null) {
  const fetcher = async (url: string): Promise<any> => {
    return self.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    medicineId ? `/api/medicines/${medicineId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    medicine: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
