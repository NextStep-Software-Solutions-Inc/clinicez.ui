import { GetHPTypes } from "@actions/hp-type.action";
import { self } from "@services/request";
import useSWR from "swr";

interface UseHPTypesConfig {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

const defaultConfig: UseHPTypesConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 300000, // 5 minutes
};

export const useHPTypes = (config: UseHPTypesConfig = {}) => {
  const mergedConfig = { ...defaultConfig, ...config };

  const fetcher = (url: string) => self.get<GetHPTypes>(url);

  return useSWR(
    "/api/hp-types",
    fetcher,
    {
      ...mergedConfig,
      onError: (error) => {
        console.error("Failed to fetch HP Types:", error);
      },
      onSuccess: (data) => {
        console.log("Successfully fetched HP Types:", data);
      }
    }
  );
};
