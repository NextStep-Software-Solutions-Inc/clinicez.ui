import { GetReferralReasons } from "@/actions/clinics/clinical-record/referral-reason.action";
import { self } from "@/services/request";
import useSWR from "swr";

interface ReferralReason {
  id: number;
  name: string;
  isActive: boolean;
  count: number;
}

export const useReferralReasons = () => {
  const fetcher = async (url: string) => {
    const result = await self.get<GetReferralReasons>(url);
    if (result.status && result.data) {
      return result.data.map((reason: ReferralReason) => ({
        ...reason,
      }));
    }
    return [];
  };

  const { data = [], isLoading } = useSWR('/api/referral-reasons', fetcher);
  return { result: data, loading: isLoading };
};
