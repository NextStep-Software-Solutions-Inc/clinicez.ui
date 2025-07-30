import { GetReferralSlips, GetReferralSlipFilters } from "@/actions/clinics/clinical-record/referral-slip.action";
import { self } from "@/services/request";
import useSWR from "swr";

import { useMemo } from "react";

const HP_IDS_PARAM = 'hpIds';

export const useReferralSlips = (filters?: GetReferralSlipFilters, enable = true) => {
  const fetcher = (args: string) => self.get<GetReferralSlips>(args);
  const url = useMemo(() => {
    const searchParams = new URLSearchParams();
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === HP_IDS_PARAM && Array.isArray(value)) {
          value.forEach(id => searchParams.append(HP_IDS_PARAM, id.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
    return `/api/referral-slips?${searchParams.toString()}`;
  }, [filters]);
  const conditionalFetcher = enable ? fetcher : null;
  return useSWR(enable ? url : null, conditionalFetcher);
}