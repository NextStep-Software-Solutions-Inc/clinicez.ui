import { GetImagingDiagnostics } from "@/actions/clinics/clinical-record/diagnostics.action";
import { self } from "@/services/request";
import useSWR from "swr";

export const useImagingDiagnostics = () => {
  const fetcher = async (url: string) => {
    const result = await self.get<GetImagingDiagnostics>(url);
    if (result.status && result.data) {
      return result.data.map(diag => ({
        ...diag,
        description: typeof diag.description === "string" ? diag.description : undefined,
      }));
    }
    return [];
  };

  const { data = [], isLoading } = useSWR('/api/diagnostics/imaging', fetcher);
  return { result: data, loading: isLoading };
};