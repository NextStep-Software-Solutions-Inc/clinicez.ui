import { GetLaboratoryRequests, GetLaboratoryRequestsFilters } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { self } from "@/services/request";
import useSWR from "swr";

export const useLaboratoryRequests = (filters: GetLaboratoryRequestsFilters) => {
  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.set(key, value.toString());
  });

  const fetcher = async (url: string): Promise<GetLaboratoryRequests> => {
    return self.get<GetLaboratoryRequests>(url);
  };

  return useSWR(`/api/laboratory-requests?${searchParams.toString()}`, fetcher);
};
