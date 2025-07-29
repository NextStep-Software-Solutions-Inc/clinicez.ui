import { GetImagingDiagnostics } from "@/actions/clinics/clinical-record/diagnostics.action";
import useSWR from "swr";

export const useDiagnostics = () => {
  const fetcher = async (url: string): Promise<GetImagingDiagnostics> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch imaging diagnostics");
    return res.json();
  };

  return useSWR(`/api/imaging-diagnostics`, fetcher);
}