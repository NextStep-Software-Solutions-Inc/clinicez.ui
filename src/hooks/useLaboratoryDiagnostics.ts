import useSWR from "swr";
import { self } from "@/services/request";
import { GetLaboratoryDiagnostics } from "@/actions/clinics/clinical-record/diagnostics.action";

const fetcher = async (url: string): Promise<GetLaboratoryDiagnostics> => {
  const data = await self.get<GetLaboratoryDiagnostics>(url);
  return data;
};

export const useLaboratoryDiagnostics = () => {
  return useSWR("/api/diagnostics/laboratory", fetcher);
};
