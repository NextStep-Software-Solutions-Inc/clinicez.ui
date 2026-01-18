import { GetHeartStationRequests, GetHeartStationRequestsFilters } from "@/actions/clinics/clinical-record/heart-station.action";
import { self } from "@/services/request";
import useSWR from "swr";

export const useHeartStationRequests = (filters: GetHeartStationRequestsFilters) => {
  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.set(key, value.toString());
  });

  const fetcher = async (url: string): Promise<GetHeartStationRequests> => {
    return self.get<GetHeartStationRequests>(url);
  };

  return useSWR(`/api/heart-station-requests?${searchParams.toString()}`, fetcher);
};
