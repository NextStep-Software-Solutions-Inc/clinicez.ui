import useSWR from "swr";
import { self } from "@/services/request";

export type LaboratoryDiagnostic = {
  id: number;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
};

export type LaboratoryDiagnosticsResponse = {
  message: string;
  data: LaboratoryDiagnostic[];
};

const fetcher = async (url: string): Promise<LaboratoryDiagnosticsResponse> => {
  const data = await self.get<LaboratoryDiagnosticsResponse>(url);
  return data;
};

export const useLaboratoryDiagnostics = () => {
  return useSWR<LaboratoryDiagnosticsResponse>(
    "/api/diagnostics/laboratory",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
};
