import { GetReferralSlips, GetReferralSlipFilters } from "@/actions/clinics/clinical-record/referral-slip.action";
import { self } from "@/services/request";
import useSWR from "swr";

export const useReferralSlips = (filters?: GetReferralSlipFilters, enable = true) => {
  const fetcher = (args: string) => self.get<GetReferralSlips>(args);

  const searchParams = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'hpIds' && Array.isArray(value)) {
        // Handle array parameters by appending each value
        value.forEach(id => searchParams.append('hpIds', id.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return useSWR(() => enable ? `/api/referral-slips?${searchParams.toString()}` : null, fetcher);
};
