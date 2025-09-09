import { GetImagingStudies, GetImagingStudiesFilters } from "@/actions/clinics/clinical-record/imaging-studies.action";
import useSWR from "swr";
import { self } from "@/services/request";

export const useImagingStudies = (filters?: GetImagingStudiesFilters) => {
  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.set(key, value.toString());
  });

  const fetcher = async (url: string): Promise<GetImagingStudies> => {
    return self.get<GetImagingStudies>(url);
  };

  return useSWR(`/api/imaging-studies?${searchParams.toString()}`, fetcher);
};